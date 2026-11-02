/** DEV schema contract. Keep column order aligned with DATABASE_SCHEMA.md. */
var APP = Object.freeze({
  VERSION: "0.1.0-dev",
  SCHEMA_VERSION: "2.1",
  ENVIRONMENT: "DEV",
  ACTOR_ID: "actor_primary"
});

var TABLES = Object.freeze({
  Catalogs: [
    "Catalog_ID","Supplier_Name","Catalog_Title","Catalog_Reference","Catalog_Revision",
    "Language_Code","Source_File_ID","Source_File_Name","MIME_Type","File_Size_Bytes",
    "SHA256","Published_Date","Received_At","Source_URL","Notes","Lifecycle_Status",
    "Created_At","Created_By"
  ],
  Catalog_Pages: [
    "Catalog_Page_ID","Catalog_ID","Page_Number","Page_Label","Created_At"
  ],
  Run_Log: [
    "Run_ID","Run_Type","Catalog_ID","Logical_Job_ID","Parent_Run_ID","Attempt_Number",
    "Retry_Reason","Idempotency_Key","Run_Status","Current_Step","Total_Units",
    "Completed_Units","Failed_Units","Worker_Version","Started_At","Heartbeat_At",
    "Worker_Lease_ID","Lease_Expires_At","Finished_At","Error_Code","Error_Summary",
    "Input_Manifest_File_ID","Output_Manifest_File_ID","Created_At","Created_By"
  ],
  Run_Units: [
    "Run_Unit_ID","Run_ID","Unit_Type","Unit_Key","Catalog_Page_ID","Unit_Status",
    "Input_SHA256","Output_Manifest_File_ID","Output_SHA256","Reused_From_Run_Unit_ID",
    "Attempt_Started_At","Attempt_Finished_At","Error_Code","Created_At"
  ]
});

var ENUMS = Object.freeze({
  "Catalogs.Lifecycle_Status": ["ACTIVE","SUPERSEDED","ARCHIVED"],
  "Run_Log.Run_Type": ["CATALOG_EXTRACTION","IMAGE_PROCESSING","PDF_GENERATION","PDF_REPRODUCTION","VALIDATION","MANUAL_IMPORT"],
  "Run_Log.Run_Status": ["QUEUED","RUNNING","WAITING_REVIEW","RETRY_PENDING","COMPLETED","FAILED","CANCELLED"],
  "Run_Units.Unit_Type": ["CATALOG_PAGE","IMAGE","PRODUCT_BATCH","PDF_STAGE","OTHER"],
  "Run_Units.Unit_Status": ["PENDING","RUNNING","COMPLETED","FAILED","SKIPPED","REUSED"]
});
