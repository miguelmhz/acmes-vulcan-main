import {NextRequest, NextResponse} from "next/server";
import path from "path";
import os from "os";
import fs from "fs";
import {spawn} from "child_process";
import {saveDocument, getDocumentById} from "@/lib/documents";
import {assignDocumentToCase} from "@/lib/cases";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Extract API called");

    // Verify request content type
    const contentType = request.headers.get("content-type");
    console.log(`Request content type: ${contentType}`);

    if (!contentType || !contentType.includes("multipart/form-data")) {
      console.error(
        "Invalid content type. Expected multipart/form-data but got:",
        contentType,
      );
      return NextResponse.json(
        {
          error: "Invalid content type. Expected multipart/form-data",
          requestContentType: contentType,
        },
        {status: 400},
      );
    }

    // Parse the form data
    let formData;
    try {
      formData = await request.formData();
      console.log("Form data parsed successfully");
      console.log("Form data keys:", [...formData.keys()]);
    } catch (error: any) {
      console.error("Error parsing form data:", error);
      return NextResponse.json(
        {error: "Error parsing form data", details: error.message},
        {status: 400},
      );
    }

    const file = formData.get("file") as File;
    const documentType = (formData.get("documentType") as string) || "other";
    const useOcr = formData.get("useOcr") === "true";
    const relatedContractId = formData.get("relatedContractId") as string;
    const caseId = formData.get("caseId") as string;

    if (!file) {
      console.error("No file provided in form data");
      return NextResponse.json({error: "No file provided"}, {status: 400});
    }

    console.log(`File name: ${file.name}, size: ${file.size} bytes`);
    console.log(`Document type: ${documentType}`);
    console.log(`Use OCR: ${useOcr}`);

    // Create a temporary directory for file processing
    const tempDir = path.resolve(process.cwd(), "temp");
    fs.mkdirSync(tempDir, {recursive: true});

    // Generate safe filename to avoid issues with special characters
    const fileExtension = path.extname(file.name);
    const fileBaseName = path.basename(file.name, fileExtension);
    const safeFileName = `${fileBaseName.replace(
      /[^a-z0-9]/gi,
      "_",
    )}${fileExtension}`;

    // Save the file to disk
    const filePath = path.join(tempDir, safeFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      fs.writeFileSync(filePath, buffer);
      console.log(`File saved to ${filePath}`);
      console.log(`File size: ${buffer.length} bytes`);
    } catch (err: any) {
      console.error(`Error saving file: ${err.message}`);
      return NextResponse.json(
        {error: "Error saving uploaded file", details: err.message},
        {status: 500},
      );
    }

    if (relatedContractId) {
      console.log(`Related contract ID: ${relatedContractId}`);
    }
    if (caseId) {
      console.log(`Case ID: ${caseId}`);
    }

    // Prepare additional arguments for the Python script
    const pythonArgs = [filePath, documentType, useOcr.toString()];

    // If we have a related contract ID, fetch it from MongoDB
    // and pass it to the Python script
    let relatedContract = null;
    if (
      relatedContractId &&
      (documentType === "fianza" || documentType === "seguro")
    ) {
      try {
        relatedContract = await getDocumentById(relatedContractId);
        if (relatedContract) {
          console.log(`Found related contract: ${relatedContract.document_id}`);
          // Pass this as an additional parameter to Python
          pythonArgs.push("--related-contract");
          pythonArgs.push(JSON.stringify(relatedContract));
        }
      } catch (error) {
        console.error("Error fetching related contract:", error);
        // Continue anyway, just log the error
      }
    }

    // Path to the Python script
    const scriptPath = path.resolve(process.cwd(), "api/python/extractor.py");

    // Path to virtual environment Python
    let pythonPath: string;
    if (os.platform() === "win32") {
      pythonPath = path.resolve(process.cwd(), "venv/Scripts/python.exe");
    } else {
      pythonPath = path.resolve(process.cwd(), "venv/bin/python");
    }

    // Execute the Python script with the file path as an argument
    const response = await new Promise<NextResponse>((resolve, reject) => {
      // Use spawn to properly separate stdout and stderr
      const pythonProcess = spawn(pythonPath, [scriptPath, ...pythonArgs]);

      console.log(`Python process started with PID: ${pythonProcess.pid}`);

      let stdoutData = "";
      let stderrData = "";
      let jsonStarted = false;

      // Collect stdout data (only the JSON output)
      pythonProcess.stdout.on("data", (data) => {
        const dataStr = data.toString();
        // Add received data to stdout buffer
        stdoutData += dataStr;
      });

      // Collect stderr data (for logging)
      pythonProcess.stderr.on("data", (data) => {
        const dataStr = data.toString();
        stderrData += dataStr;
        console.error(`Python stderr: ${dataStr}`);
      });

      pythonProcess.on("close", async (code) => {
        console.log(`Python process exited with code ${code}`);

        // For debugging
        if (stderrData) {
          console.log("Python process stderr output:", stderrData);
        }

        try {
          // Try to clean up the temporary file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err: any) {
          console.error("Error cleaning up temp file:", err);
        }

        if (code !== 0) {
          console.error("Python process error:", stderrData);
          resolve(
            NextResponse.json(
              {error: "Error processing document", details: stderrData},
              {status: 500},
            ),
          );
          return;
        }

        // Validate the stdout output
        if (!stdoutData || stdoutData.trim() === "") {
          console.error("No stdout output from Python process");
          resolve(
            NextResponse.json(
              {error: "No output from document processor"},
              {status: 500},
            ),
          );
          return;
        }

        try {
          // Extract JSON from stdout
          const jsonPattern = /---JSON_START---\n([\s\S]*?)---JSON_END---/;
          const jsonMatch = stdoutData.match(jsonPattern);
          console.log(`JSON match: ${jsonMatch}`);
          const jsonString = jsonMatch ? jsonMatch[1] : null;
          console.log(`JSON string: ${jsonString}`);

          if (!jsonString) {
            throw new Error("No JSON output found in Python response");
          }

          // Parse the JSON
          const extractionResult = JSON.parse(jsonString);

          // Debug output to see the structure
          console.log(
            `Extraction result structure keys: ${Object.keys(
              extractionResult,
            ).join(", ")}`,
          );

          // Normalize the response structure to ensure it works with the UI
          if (
            !extractionResult.hasOwnProperty("fields") &&
            !extractionResult.error
          ) {
            console.log(
              "Restructuring extraction result to include fields property",
            );
            const tempFields = {...extractionResult};
            delete tempFields.document_type;
            delete tempFields.document_id;
            delete tempFields.raw_text;
            delete tempFields.metadata;
            delete tempFields.processing_time;

            // Create properly structured result
            extractionResult.fields = tempFields;
          }

          // Check if fields are properly structured
          if (extractionResult.fields) {
            console.log(
              `Fields structure: ${JSON.stringify(
                Object.keys(extractionResult.fields),
              )}`,
            );
            console.log(
              `Fields content preview: ${JSON.stringify(
                extractionResult.fields,
              ).substring(0, 300)}...`,
            );
          } else {
            console.log(`Warning: No fields property in extraction result`);
          }

          // Add relation to contract if provided
          if (
            relatedContractId &&
            (documentType === "fianza" || documentType === "seguro")
          ) {
            extractionResult.related_contract_id = relatedContractId;
          }

          // Add case_id if provided
          if (caseId) {
            extractionResult.case_id = caseId;
          }

          // Save extraction result to MongoDB
          try {
            const dbId = await saveDocument(extractionResult);
            extractionResult.db_id = dbId;
            console.log(`Saved extraction result to MongoDB with ID: ${dbId}`);

            // If case_id is provided, assign document to case
            if (caseId && extractionResult.document_id) {
              const assignResult = await assignDocumentToCase(
                extractionResult.document_id,
                caseId,
              );
              console.log(`Document assigned to case: ${assignResult}`);
            }
          } catch (dbError: any) {
            console.error("Error saving to MongoDB:", dbError);
            // Continue anyway, just log the error
          }

          resolve(NextResponse.json(extractionResult));
        } catch (err: any) {
          console.error("Error parsing JSON result:", err);
          console.error("Raw stdout:", stdoutData);
          resolve(
            NextResponse.json(
              {
                error: "Error parsing extraction results",
                details: err.message,
                stdout: stdoutData,
              },
              {status: 500},
            ),
          );
        }
      });

      pythonProcess.on("error", (err) => {
        console.error("Failed to start Python process:", err);
        resolve(
          NextResponse.json(
            {error: "Failed to start extraction process", details: err.message},
            {status: 500},
          ),
        );
      });
    });

    return response;
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json(
      {error: "Server error", details: error.message},
      {status: 500},
    );
  }
}
