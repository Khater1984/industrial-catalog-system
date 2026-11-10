// Auto-generated bundle. Do not edit.

// ===== config/Schema.js =====

/** Generated from approved V2.1 domain schema + ENUM_REGISTRY.md. Do not hand-edit table headers. */
var APP = Object.freeze({ VERSION: "0.2.0-dev", SCHEMA_VERSION: "2.1", ENVIRONMENT: "DEV", ACTOR_ID: "actor_primary" });

var TABLES = Object.freeze({
  Catalogs: ["Catalog_ID", "Supplier_Name", "Catalog_Title", "Catalog_Reference", "Catalog_Revision", "Language_Code", "Source_File_ID", "Source_File_Name", "MIME_Type", "File_Size_Bytes", "SHA256", "Published_Date", "Received_At", "Source_URL", "Notes", "Lifecycle_Status", "Created_At", "Created_By"],
  Catalog_Pages: ["Catalog_Page_ID", "Catalog_ID", "Page_Number", "Page_Label", "Created_At"],
  Products: ["Product_ID", "Lifecycle_Status", "Canonical_Notes", "Created_At", "Created_By"],
  Variants: ["Variant_ID", "Product_ID", "Lifecycle_Status", "Canonical_Notes", "Created_At", "Created_By"],
  Product_Source_Records: ["Product_Source_Record_ID", "Product_ID", "Catalog_ID", "Source_Record_Key", "Source_Key_Algorithm_Version", "Source_Product_Name", "Source_Product_Reference", "Catalog_Page_ID", "Printed_Page_Label", "Source_Section", "Source_Quote", "Extraction_Run_ID", "Extraction_Record_ID", "Identity_Resolution", "Match_Decision_ID", "Created_At", "Created_By"],
  Variant_Source_Records: ["Variant_Source_Record_ID", "Variant_ID", "Product_Source_Record_ID", "Source_Record_Key", "Source_Key_Algorithm_Version", "Source_Model_Number", "Source_Model_Name", "Catalog_Page_ID", "Printed_Page_Label", "Source_Section", "Source_Quote", "Extraction_Run_ID", "Extraction_Record_ID", "Identity_Resolution", "Match_Decision_ID", "Created_At", "Created_By"],
  Identity_Match_Decisions: ["Match_Decision_ID", "Entity_Type", "Source_Staging_Type", "Source_Staging_ID", "Source_Staging_Hash", "Parent_Product_Match_Decision_ID", "Candidate_Canonical_ID", "Decision", "Result_Canonical_ID", "Evidence_JSON_File_ID", "Evidence_SHA256", "Rationale", "Decided_At", "Decided_By", "Supersedes_Decision_ID"],
  Specifications: ["Specification_ID", "Source_Assertion_Key", "Source_Key_Algorithm_Version", "Scope", "Product_Source_Record_ID", "Variant_Source_Record_ID", "Product_ID", "Variant_ID", "Attribute_Key_Source", "Attribute_Value_Source", "Unit_Source", "Normalized_Key", "Normalized_Value_JSON", "Normalized_Unit", "Catalog_Page_ID", "Printed_Page_Label", "Source_Section", "Source_Quote", "Extraction_Run_ID", "Extraction_Confidence", "Created_At", "Created_By"],
  Product_Company: ["Product_ID", "Product_Name_EN", "Product_Name_AR", "Company_Description", "Manufacturer_or_Product_Brand_Label", "Product_Family_ID", "Company_Notes", "Updated_At", "Updated_By"],
  Variant_Company: ["Variant_ID", "Model_Name_EN", "Model_Name_AR", "Company_Model_Notes", "Updated_At", "Updated_By"],
  Product_Families: ["Product_Family_ID", "Family_Name_EN", "Family_Name_AR", "Parent_Family_ID", "Description", "Sort_Order", "Status", "Created_At", "Updated_At"],
  Attribute_Definitions: ["Attribute_ID", "Attribute_Key", "Label_EN", "Label_AR", "Data_Type", "Unit_Code", "Allowed_Values_JSON_File_ID", "Allowed_Values_JSON", "Applicable_Scope", "Is_Required", "Validation_Rule_JSON", "Display_Order", "Status", "Created_At", "Updated_At"],
  Product_Attributes: ["Product_Attribute_ID", "Product_ID", "Attribute_ID", "Value_JSON", "Updated_At", "Updated_By"],
  Variant_Attribute_Overrides: ["Variant_Override_ID", "Variant_ID", "Attribute_ID", "Override_Mode", "Value_JSON", "Updated_At", "Updated_By"],
  Specification_Changes: ["Specification_Change_ID", "Logical_Specification_Key", "Sequence_No", "Operation", "Target_Specification_ID", "Product_ID", "Variant_ID", "Attribute_Key", "Value_JSON", "Unit_Code", "Change_Status", "Reason", "Created_At", "Created_By", "Approved_At", "Approved_By", "Approval_Payload_SHA256"],
  Documents: ["Doc_ID", "Document_Type", "Title", "Language_Code", "Description", "Current_Version_ID", "Lifecycle_Status", "Created_At", "Created_By", "Updated_At", "Updated_By"],
  Document_Versions: ["Version_ID", "Doc_ID", "Version_Label", "Drive_File_ID", "Original_File_Name", "MIME_Type", "File_Size_Bytes", "SHA256", "Uploaded_At", "Uploaded_By", "Version_Notes", "Source_Type", "Source_Catalog_ID", "Source_Catalog_Page_ID", "Source_Product_Source_Record_ID", "Source_Variant_Source_Record_ID", "Source_Quote", "Source_URL", "Extraction_Run_ID", "Extraction_Record_ID", "Supersedes_Version_ID", "Lifecycle_Status"],
  Document_Links: ["Link_ID", "Doc_ID", "Target_Type", "Target_ID", "Link_Mode", "Pinned_Version_ID", "Display_Order", "Created_At", "Created_By", "Link_Notes"],
  Image_Assets: ["Image_ID", "Original_File_ID", "Original_File_Name", "MIME_Type", "Width_PX", "Height_PX", "File_Size_Bytes", "Has_Alpha", "Color_Space", "Orientation", "SHA256", "PHash", "Source_Type", "Source_Catalog_ID", "Source_Catalog_Page_ID", "Source_Product_Source_Record_ID", "Source_Variant_Source_Record_ID", "Source_Document_Version_ID", "Source_Page_Label", "Quality_Status", "Lifecycle_Status", "Duplicate_Of_Image_ID", "Created_At", "Created_By"],
  Image_Renditions: ["Image_Rendition_ID", "Image_ID", "Rendition_Type", "Drive_File_ID", "SHA256", "MIME_Type", "Width_PX", "Height_PX", "File_Size_Bytes", "Pipeline_Version", "Source_SHA256", "Created_At"],
  Image_Links: ["Image_Link_ID", "Image_ID", "Catalog_Rendition_ID", "DataSheet_Rendition_ID", "Target_Type", "Target_ID", "Is_Primary", "Catalog_Approved", "DataSheet_Approved", "Catalog_Order", "DataSheet_Order", "Catalog_Crop_JSON", "DataSheet_Crop_JSON", "Link_Status", "Created_At", "Created_By", "Updated_At", "Updated_By"],
  Image_Review_Pairs: ["Review_Pair_ID", "Image_A_ID", "Image_B_ID", "Algorithm", "Distance", "Decision", "Reviewed_At", "Reviewed_By", "Notes"],
  Design_Assets: ["Design_Asset_ID", "Asset_Type", "Asset_Name", "Drive_File_ID", "MIME_Type", "File_Size_Bytes", "SHA256", "License_Notes", "Created_At", "Created_By"],
  Brands: ["Brand_ID", "Brand_Name", "Description", "Identity_Type", "Lifecycle_Status", "Created_At", "Created_By"],
  Brand_Versions: ["Brand_Version_ID", "Brand_ID", "Version_Number", "Version_Status", "Design_Config_File_ID", "Config_SHA256", "Published_At", "Published_By", "Change_Notes", "Created_At", "Created_By"],
  Brand_Assets: ["Brand_Asset_ID", "Brand_ID", "Design_Asset_ID", "Usage_Role", "Lifecycle_Status", "Created_At", "Created_By"],
  Papers: ["Paper_ID", "Paper_Name", "Lifecycle_Status", "Created_At", "Created_By"],
  Paper_Versions: ["Paper_Version_ID", "Paper_ID", "Version_Number", "Version_Status", "Paper_Config_File_ID", "Config_SHA256", "Texture_Asset_ID", "Texture_SHA256", "Published_At", "Published_By", "Created_At", "Created_By"],
  Templates: ["Template_ID", "Template_Name", "Document_Type", "Description", "Lifecycle_Status", "Created_At", "Created_By"],
  Template_Versions: ["Template_Version_ID", "Template_ID", "Version_Number", "Version_Status", "Template_Config_File_ID", "Config_SHA256", "Preview_File_ID", "Published_At", "Published_By", "Change_Notes", "Created_At", "Created_By"],
  Template_Identity_Links: ["Template_Identity_Link_ID", "Template_ID", "Brand_ID", "Is_Default", "Status", "Created_At"],
  Watermark_Presets: ["Watermark_ID", "Watermark_Name", "Watermark_Type", "Text_Content", "Design_Asset_ID", "Position", "Opacity", "Rotation_Degrees", "Width_Percent", "Color_HEX", "Layer", "Page_Application_JSON", "Lifecycle_Status", "Created_At", "Updated_At"],
  Status_Defaults: ["Status_Default_ID", "Document_Status", "Suggested_Watermark_ID", "Is_Active", "Updated_At"],
  Contact_Profiles: ["Contact_Profile_ID", "Profile_Name", "Phone", "Email", "Website_URL", "LinkedIn_URL", "Facebook_URL", "Instagram_URL", "YouTube_URL", "Display_Config_JSON", "Lifecycle_Status", "Created_At", "Updated_At"],
  Export_Profiles: ["Export_Profile_ID", "Profile_Name", "Output_Class", "Target_DPI", "Minimum_DPI_Warning", "Minimum_DPI_Block", "Color_Mode", "PDF_Standard", "Bleed_MM", "Safe_Margin_MM", "Embed_Fonts", "Compression_Config_JSON", "Printer_Specification_Notes", "Printer_Spec_File_ID", "Printer_Spec_SHA256", "Color_Profile_Design_Asset_ID", "Trim_Box_JSON", "Lifecycle_Status", "Created_At", "Updated_At"],
  Issued_Documents: ["Issued_Document_ID", "Issue_Operation_ID", "Issue_Number", "Document_Type", "Product_ID", "Variant_ID", "Scope_Snapshot_JSON_File_ID", "Issue_Manifest_File_ID", "Issue_Manifest_SHA256", "Brand_ID", "Brand_Version_ID", "Template_ID", "Template_Version_ID", "Paper_ID", "Paper_Version_ID", "Watermark_ID", "Document_Status", "Contact_Profile_ID", "Export_Profile_ID", "Snapshot_File_ID", "Snapshot_SHA256", "PDF_File_ID", "PDF_SHA256", "Output_Class", "Issued_At", "Issued_By", "Worker_Version", "Chromium_Version", "Playwright_Version", "PDF_Renderer_Version", "Font_Fingerprints_JSON_File_ID", "Image_Processing_Version", "Preflight_Report_File_ID", "Issue_Notes"],
  Issued_Document_Items: ["Issued_Document_Item_ID", "Issued_Document_ID", "Item_Order", "Product_ID", "Variant_ID", "Item_Snapshot_Key", "Created_At"],
  Issue_Operations: ["Issue_Operation_ID", "Issue_Key", "Input_Fingerprint_SHA256", "Run_ID", "Source_Issued_Document_ID", "Operation_Status", "Intended_Issued_Document_ID", "Scope_Manifest_File_ID", "Scope_Manifest_SHA256", "Dependency_Manifest_File_ID", "Dependency_Manifest_SHA256", "Rendered_PDF_File_ID", "Rendered_PDF_SHA256", "Preflight_Report_File_ID", "Created_At", "Created_By", "Started_At", "Finished_At", "Error_Code", "Recovery_Notes"],
  Run_Log: ["Run_ID", "Run_Type", "Catalog_ID", "Logical_Job_ID", "Parent_Run_ID", "Attempt_Number", "Retry_Reason", "Idempotency_Key", "Run_Status", "Current_Step", "Total_Units", "Completed_Units", "Failed_Units", "Worker_Version", "Started_At", "Heartbeat_At", "Worker_Lease_ID", "Lease_Expires_At", "Finished_At", "Error_Code", "Error_Summary", "Input_Manifest_File_ID", "Output_Manifest_File_ID", "Created_At", "Created_By"],
  Run_Units: ["Run_Unit_ID", "Run_ID", "Unit_Type", "Unit_Key", "Catalog_Page_ID", "Unit_Status", "Input_SHA256", "Output_Manifest_File_ID", "Output_SHA256", "Reused_From_Run_Unit_ID", "Attempt_Started_At", "Attempt_Finished_At", "Error_Code", "Created_At"],
  Run_Events: ["Run_Event_ID", "Event_Idempotency_Key", "Run_ID", "Event_Type", "Unit_Type", "Unit_Reference_ID", "Progress_Count", "Message", "Details_File_ID", "Occurred_At", "Actor_ID"],
  Staging_Products: ["Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region", "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method", "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence", "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At", "Proposed_Product_Name_EN", "Proposed_Product_Reference", "Candidate_Product_ID", "Identity_Match_Method", "Match_Confidence", "Source_Record_Key"],
  Staging_Variants: ["Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region", "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method", "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence", "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At", "Parent_Staging_Product_ID", "Proposed_Model_Number", "Proposed_Model_Name", "Candidate_Variant_ID", "Identity_Match_Method", "Match_Confidence", "Source_Record_Key"],
  Staging_Specifications: ["Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region", "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method", "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence", "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At", "Parent_Staging_Product_ID", "Parent_Staging_Variant_ID", "Source_Assertion_Key", "Scope", "Attribute_Key_Raw", "Value_Raw", "Unit_Raw", "Normalized_Key", "Normalized_Value_JSON", "Normalized_Unit", "Parse_Status"],
  Staging_Images: ["Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region", "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method", "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence", "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At", "Proposed_Image_File_ID", "Original_File_Name", "MIME_Type", "Width_PX", "Height_PX", "File_Size_Bytes", "SHA256", "PHash", "Candidate_Product_ID", "Candidate_Variant_ID", "Image_Role", "Quality_Status"],
  Staging_Documents: ["Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region", "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method", "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence", "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At", "Proposed_Document_File_ID", "Title", "Document_Type", "Language_Code", "File_Size_Bytes", "SHA256", "Candidate_Product_ID", "Candidate_Variant_ID"],
  Review_Queue: ["Review_Queue_ID", "Review_Type", "Priority", "Review_Status", "Proposed_Action", "Decision_JSON_File_ID", "Decision_SHA256", "Staging_Set_Manifest_File_ID", "Staging_Set_SHA256", "Reviewed_Payload_Hash", "Decision_Notes", "Assigned_Actor_ID", "Created_At", "Created_By", "Reviewed_At", "Reviewed_By"],
  Audit_Log: ["Audit_ID", "Event_Idempotency_Key", "Payload_SHA256", "Event_At", "Actor_ID", "Action", "Entity_Type", "Entity_ID", "Field_Name", "Before_Value_JSON", "After_Value_JSON", "Change_Manifest_File_ID", "Reason", "Related_Run_ID", "Related_Review_ID"],
  Review_Staging_Links: ["Review_Staging_Link_ID", "Review_Queue_ID", "Staging_ID", "Review_Role", "Created_At", "Created_By"],
  System_Config: ["Config_ID", "Config_Key", "Value_Type", "Value_Text", "Environment_ID", "Schema_Version", "Is_Secret", "Updated_At", "Updated_By", "Description"],
  Promotion_Operations: ["Promotion_Operation_ID", "Promotion_Key", "Run_ID", "Operation_Status", "Staging_Set_Manifest_File_ID", "Staging_Set_SHA256", "Intended_Output_Manifest_File_ID", "Intended_Output_SHA256", "Created_At", "Created_By", "Started_At", "Finished_At", "Recovery_Notes"],
  Promotion_Mappings: ["Promotion_Mapping_ID", "Promotion_Operation_ID", "Staging_Type", "Staging_ID", "Production_Entity_Type", "Production_Entity_ID", "Canonical_Entity_Type", "Canonical_Entity_ID", "Identity_Match_Decision_ID", "Payload_SHA256", "Created_At"]
});

var ENUMS = Object.freeze({
  "Catalogs.Lifecycle_Status": ["ACTIVE", "SUPERSEDED", "ARCHIVED"],
  "Products.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Variants.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Product_Source_Records.Identity_Resolution": ["MATCH_EXISTING", "CREATE_NEW"],
  "Variant_Source_Records.Identity_Resolution": ["MATCH_EXISTING", "CREATE_NEW"],
  "Identity_Match_Decisions.Entity_Type": ["PRODUCT", "VARIANT"],
  "Identity_Match_Decisions.Source_Staging_Type": ["STAGING_PRODUCT", "STAGING_VARIANT"],
  "Identity_Match_Decisions.Decision": ["MATCH_EXISTING", "CREATE_NEW", "REJECT_SOURCE", "DEFER"],
  "Specifications.Scope": ["PRODUCT", "VARIANT"],
  "Product_Families.Status": ["ACTIVE", "ARCHIVED"],
  "Attribute_Definitions.Data_Type": ["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "DATE", "URL", "MEASUREMENT"],
  "Attribute_Definitions.Applicable_Scope": ["PRODUCT", "VARIANT", "BOTH"],
  "Attribute_Definitions.Status": ["ACTIVE", "ARCHIVED"],
  "Variant_Attribute_Overrides.Override_Mode": ["VALUE", "INTENTIONALLY_EMPTY"],
  "Specification_Changes.Operation": ["ADD", "UPDATE", "DELETE"],
  "Specification_Changes.Change_Status": ["DRAFT", "APPROVED", "REJECTED"],
  "Documents.Document_Type": ["USER_MANUAL", "BROCHURE", "CERTIFICATE", "WARRANTY", "OTHER"],
  "Documents.Lifecycle_Status": ["DRAFT", "ACTIVE", "ARCHIVED"],
  "Document_Versions.Lifecycle_Status": ["AVAILABLE", "QUARANTINED", "ARCHIVED"],
  "Document_Versions.Source_Type": ["CATALOG_EMBEDDED", "MANUAL_UPLOAD", "EXTERNAL_LINK", "OTHER"],
  "Document_Links.Target_Type": ["PRODUCT", "VARIANT"],
  "Document_Links.Link_Mode": ["INCLUDE", "EXCLUDE"],
  "Image_Assets.Color_Space": ["SRGB", "DISPLAY_P3", "CMYK", "GRAYSCALE", "UNKNOWN"],
  "Image_Assets.Orientation": ["NORMALIZED", "EXIF_ROTATED", "UNKNOWN"],
  "Image_Assets.Source_Type": ["CATALOG_EMBEDDED", "PAGE_RENDER", "MANUAL_UPLOAD", "OTHER"],
  "Image_Assets.Quality_Status": ["UNASSESSED", "ACCEPTABLE", "LOW_RESOLUTION", "CORRUPT", "NEEDS_REVIEW"],
  "Image_Assets.Lifecycle_Status": ["ACTIVE", "ARCHIVED", "QUARANTINED"],
  "Image_Renditions.Rendition_Type": ["PREVIEW", "HIGH_QUALITY", "CATALOG_READY", "THUMBNAIL", "NORMALIZED_ORIGINAL"],
  "Image_Links.Target_Type": ["PRODUCT", "VARIANT"],
  "Image_Links.Link_Status": ["CANDIDATE", "ACTIVE", "REJECTED", "ARCHIVED"],
  "Image_Review_Pairs.Decision": ["PENDING", "SAME_ASSET", "DISTINCT", "RELATED"],
  "Design_Assets.Asset_Type": ["LOGO", "FONT", "GRAPHIC", "ICON", "BACKGROUND", "TEXTURE", "WATERMARK", "ICC_PROFILE", "OTHER"],
  "Brands.Identity_Type": ["BUILT_IN", "COMPANY"],
  "Brands.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Brand_Versions.Version_Status": ["DRAFT", "PUBLISHED", "RETIRED"],
  "Brand_Assets.Usage_Role": ["PRIMARY_LOGO", "SECONDARY_LOGO", "FONT", "GRAPHIC", "ICON", "BACKGROUND", "OTHER"],
  "Brand_Assets.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Papers.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Paper_Versions.Version_Status": ["DRAFT", "PUBLISHED", "RETIRED"],
  "Templates.Document_Type": ["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG", "COMPANY_PROFILE"],
  "Templates.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Template_Versions.Version_Status": ["DRAFT", "PUBLISHED", "RETIRED"],
  "Template_Identity_Links.Status": ["ACTIVE", "DISABLED"],
  "Watermark_Presets.Watermark_Type": ["TEXT", "LOGO", "IMAGE"],
  "Watermark_Presets.Position": ["CENTER", "TOP", "BOTTOM", "CUSTOM"],
  "Watermark_Presets.Layer": ["BEHIND_CONTENT", "ABOVE_CONTENT"],
  "Watermark_Presets.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Status_Defaults.Document_Status": ["ORIGINAL", "PRELIMINARY", "CONFIDENTIAL", "REVISED", "FINAL"],
  "Contact_Profiles.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Export_Profiles.Output_Class": ["DIGITAL_PDF", "PRINT_ORIENTED_PDF", "PRINT_READY_PDF"],
  "Export_Profiles.Color_Mode": ["RGB", "CMYK_REQUIRED", "PRINTER_DEFINED"],
  "Export_Profiles.PDF_Standard": ["NONE", "PDF_X_1A", "PDF_X_4", "OTHER_REQUIRED"],
  "Export_Profiles.Lifecycle_Status": ["ACTIVE", "ARCHIVED"],
  "Issued_Documents.Document_Type": ["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG"],
  "Issued_Documents.Document_Status": ["ORIGINAL", "PRELIMINARY", "CONFIDENTIAL", "REVISED", "FINAL"],
  "Issued_Documents.Output_Class": ["DIGITAL_PDF", "PRINT_ORIENTED_PDF", "PRINT_READY_PDF"],
  "Issue_Operations.Operation_Status": ["PREPARED", "PREFLIGHT", "RENDERING", "VALIDATING", "IN_DOUBT", "COMPLETED", "FAILED", "CANCELLED"],
  "Run_Log.Run_Type": ["CATALOG_EXTRACTION", "IMAGE_PROCESSING", "PDF_GENERATION", "PDF_REPRODUCTION", "VALIDATION", "MANUAL_IMPORT"],
  "Run_Log.Run_Status": ["QUEUED", "RUNNING", "WAITING_REVIEW", "RETRY_PENDING", "COMPLETED", "FAILED", "CANCELLED"],
  "Run_Units.Unit_Type": ["CATALOG_PAGE", "IMAGE", "PRODUCT_BATCH", "PDF_STAGE", "OTHER"],
  "Run_Units.Unit_Status": ["PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED", "REUSED"],
  "Run_Events.Event_Type": ["CREATED", "STARTED", "PROGRESS", "WARNING", "ERROR", "RETRY", "WAITING_REVIEW", "RESUMED", "LEASE_ACQUIRED", "LEASE_EXPIRED", "UNIT_REUSED", "RESULT_ACCEPTED", "COMPLETED", "CANCELLED"],
  "Common staging envelope (all Staging_* sheets).Extraction_Method": ["EMBEDDED_TEXT", "TABLE_PARSER", "OCR", "IMAGE_EXTRACTION", "MANUAL"],
  "Common staging envelope (all Staging_* sheets).Proposed_Status": ["NEW", "NEEDS_REVIEW", "REJECTED", "PROMOTED"],
  "Staging_Specifications.Scope": ["PRODUCT", "VARIANT"],
  "Staging_Specifications.Parse_Status": ["UNPARSED", "PARSED", "AMBIGUOUS", "INVALID"],
  "Staging_Images.Quality_Status": ["UNASSESSED", "ACCEPTABLE", "LOW_RESOLUTION", "NEEDS_REVIEW"],
  "Staging_Documents.Document_Type": ["USER_MANUAL", "BROCHURE", "CERTIFICATE", "WARRANTY", "OTHER"],
  "Review_Queue.Review_Type": ["PRODUCT_MATCH", "VARIANT_MATCH", "SPECIFICATION", "IMAGE_DUPLICATE", "IMAGE_QUALITY", "DOCUMENT_MATCH", "EXTRACTION_AMBIGUITY", "OTHER"],
  "Review_Queue.Priority": ["LOW", "NORMAL", "HIGH"],
  "Review_Queue.Review_Status": ["OPEN", "IN_REVIEW", "APPROVED", "REJECTED", "DEFERRED", "STALE", "SUPERSEDED"],
  "Audit_Log.Action": ["CREATE", "UPDATE", "APPROVE", "REJECT", "PROMOTE", "ARCHIVE", "PUBLISH", "ISSUE", "RESTORE_POINTER", "LINK", "UNLINK", "OVERRIDE_WARNING"],
  "Review_Staging_Links.Review_Role": ["PRIMARY", "RELATED", "EVIDENCE"],
  "System_Config.Value_Type": ["TEXT", "INTEGER", "BOOLEAN", "JSON", "DRIVE_FILE_ID", "SPREADSHEET_ID"],
  "System_Config.Environment_ID": ["DEV", "TEST", "PROD"],
  "Promotion_Operations.Operation_Status": ["PREPARED", "APPLYING", "IN_DOUBT", "COMPLETED", "QUARANTINED", "CANCELLED"],
  "Promotion_Mappings.Staging_Type": ["PRODUCT", "VARIANT", "SPECIFICATION", "IMAGE", "DOCUMENT"],
  "Promotion_Mappings.Production_Entity_Type": ["PRODUCT", "VARIANT", "PRODUCT_SOURCE_RECORD", "VARIANT_SOURCE_RECORD", "SPECIFICATION", "IMAGE_ASSET", "DOCUMENT"],
  "Promotion_Mappings.Canonical_Entity_Type": ["PRODUCT", "VARIANT"]
});

var ENUM_REQUIRED = Object.freeze({
  "Catalogs.Lifecycle_Status": true,
  "Products.Lifecycle_Status": true,
  "Variants.Lifecycle_Status": true,
  "Product_Source_Records.Identity_Resolution": true,
  "Variant_Source_Records.Identity_Resolution": true,
  "Identity_Match_Decisions.Entity_Type": true,
  "Identity_Match_Decisions.Source_Staging_Type": true,
  "Identity_Match_Decisions.Decision": true,
  "Specifications.Scope": true,
  "Product_Families.Status": true,
  "Attribute_Definitions.Data_Type": true,
  "Attribute_Definitions.Applicable_Scope": true,
  "Attribute_Definitions.Status": true,
  "Variant_Attribute_Overrides.Override_Mode": true,
  "Specification_Changes.Operation": true,
  "Specification_Changes.Change_Status": true,
  "Documents.Document_Type": true,
  "Documents.Lifecycle_Status": true,
  "Document_Versions.Lifecycle_Status": true,
  "Document_Versions.Source_Type": true,
  "Document_Links.Target_Type": true,
  "Document_Links.Link_Mode": true,
  "Image_Assets.Color_Space": false,
  "Image_Assets.Orientation": true,
  "Image_Assets.Source_Type": true,
  "Image_Assets.Quality_Status": true,
  "Image_Assets.Lifecycle_Status": true,
  "Image_Renditions.Rendition_Type": true,
  "Image_Links.Target_Type": true,
  "Image_Links.Link_Status": true,
  "Image_Review_Pairs.Decision": true,
  "Design_Assets.Asset_Type": true,
  "Brands.Identity_Type": true,
  "Brands.Lifecycle_Status": true,
  "Brand_Versions.Version_Status": true,
  "Brand_Assets.Usage_Role": true,
  "Brand_Assets.Lifecycle_Status": true,
  "Papers.Lifecycle_Status": true,
  "Paper_Versions.Version_Status": true,
  "Templates.Document_Type": true,
  "Templates.Lifecycle_Status": true,
  "Template_Versions.Version_Status": true,
  "Template_Identity_Links.Status": true,
  "Watermark_Presets.Watermark_Type": true,
  "Watermark_Presets.Position": true,
  "Watermark_Presets.Layer": true,
  "Watermark_Presets.Lifecycle_Status": true,
  "Status_Defaults.Document_Status": true,
  "Contact_Profiles.Lifecycle_Status": true,
  "Export_Profiles.Output_Class": true,
  "Export_Profiles.Color_Mode": true,
  "Export_Profiles.PDF_Standard": true,
  "Export_Profiles.Lifecycle_Status": true,
  "Issued_Documents.Document_Type": true,
  "Issued_Documents.Document_Status": true,
  "Issued_Documents.Output_Class": true,
  "Issue_Operations.Operation_Status": true,
  "Run_Log.Run_Type": true,
  "Run_Log.Run_Status": true,
  "Run_Units.Unit_Type": true,
  "Run_Units.Unit_Status": true,
  "Run_Events.Event_Type": true,
  "Common staging envelope (all Staging_* sheets).Extraction_Method": true,
  "Common staging envelope (all Staging_* sheets).Proposed_Status": true,
  "Staging_Specifications.Scope": true,
  "Staging_Specifications.Parse_Status": true,
  "Staging_Images.Quality_Status": true,
  "Staging_Documents.Document_Type": true,
  "Review_Queue.Review_Type": true,
  "Review_Queue.Priority": true,
  "Review_Queue.Review_Status": true,
  "Audit_Log.Action": true,
  "Review_Staging_Links.Review_Role": true,
  "System_Config.Value_Type": true,
  "System_Config.Environment_ID": true,
  "Promotion_Operations.Operation_Status": true,
  "Promotion_Mappings.Staging_Type": true,
  "Promotion_Mappings.Production_Entity_Type": true,
  "Promotion_Mappings.Canonical_Entity_Type": false
});

var FIELD_RULES = Object.freeze({
  "Catalogs.Catalog_ID": { type: "ID", required: true, conditional: false },
  "Catalogs.Supplier_Name": { type: "TEXT(200)", required: true, conditional: false },
  "Catalogs.Catalog_Title": { type: "TEXT(300)", required: false, conditional: false },
  "Catalogs.Catalog_Reference": { type: "TEXT(120)", required: false, conditional: false },
  "Catalogs.Catalog_Revision": { type: "TEXT(80)", required: false, conditional: false },
  "Catalogs.Language_Code": { type: "TEXT(10)", required: false, conditional: false },
  "Catalogs.Source_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Catalogs.Source_File_Name": { type: "TEXT(255)", required: true, conditional: false },
  "Catalogs.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Catalogs.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Catalogs.SHA256": { type: "HEX64", required: true, conditional: false },
  "Catalogs.Published_Date": { type: "DATE", required: false, conditional: false },
  "Catalogs.Received_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Catalogs.Source_URL": { type: "URL", required: false, conditional: false },
  "Catalogs.Notes": { type: "TEXT(2000)", required: false, conditional: false },
  "Catalogs.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Catalogs.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Catalogs.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Catalog_Pages.Catalog_Page_ID": { type: "ID", required: true, conditional: false },
  "Catalog_Pages.Catalog_ID": { type: "ID", required: true, conditional: false },
  "Catalog_Pages.Page_Number": { type: "INTEGER", required: true, conditional: false },
  "Catalog_Pages.Page_Label": { type: "TEXT(80)", required: false, conditional: false },
  "Catalog_Pages.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Products.Product_ID": { type: "ID", required: true, conditional: false },
  "Products.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Products.Canonical_Notes": { type: "TEXT(2000)", required: false, conditional: false },
  "Products.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Products.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Variants.Variant_ID": { type: "ID", required: true, conditional: false },
  "Variants.Product_ID": { type: "ID", required: true, conditional: false },
  "Variants.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Variants.Canonical_Notes": { type: "TEXT(2000)", required: false, conditional: false },
  "Variants.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Variants.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Product_Source_Records.Product_Source_Record_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Product_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Catalog_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Source_Record_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Product_Source_Records.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Product_Source_Records.Source_Product_Name": { type: "TEXT(300)", required: true, conditional: false },
  "Product_Source_Records.Source_Product_Reference": { type: "TEXT(160)", required: false, conditional: false },
  "Product_Source_Records.Catalog_Page_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Printed_Page_Label": { type: "TEXT(80)", required: false, conditional: false },
  "Product_Source_Records.Source_Section": { type: "TEXT(200)", required: false, conditional: false },
  "Product_Source_Records.Source_Quote": { type: "TEXT(2000)", required: false, conditional: false },
  "Product_Source_Records.Extraction_Run_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Extraction_Record_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Identity_Resolution": { type: "ENUM", required: true, conditional: false },
  "Product_Source_Records.Match_Decision_ID": { type: "ID", required: true, conditional: false },
  "Product_Source_Records.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Product_Source_Records.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Variant_Source_Records.Variant_Source_Record_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Variant_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Product_Source_Record_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Source_Record_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Variant_Source_Records.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Variant_Source_Records.Source_Model_Number": { type: "TEXT(160)", required: true, conditional: false },
  "Variant_Source_Records.Source_Model_Name": { type: "TEXT(250)", required: false, conditional: false },
  "Variant_Source_Records.Catalog_Page_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Printed_Page_Label": { type: "TEXT(80)", required: false, conditional: false },
  "Variant_Source_Records.Source_Section": { type: "TEXT(200)", required: false, conditional: false },
  "Variant_Source_Records.Source_Quote": { type: "TEXT(2000)", required: false, conditional: false },
  "Variant_Source_Records.Extraction_Run_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Extraction_Record_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Identity_Resolution": { type: "ENUM", required: true, conditional: false },
  "Variant_Source_Records.Match_Decision_ID": { type: "ID", required: true, conditional: false },
  "Variant_Source_Records.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Variant_Source_Records.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Identity_Match_Decisions.Match_Decision_ID": { type: "ID", required: true, conditional: false },
  "Identity_Match_Decisions.Entity_Type": { type: "ENUM", required: true, conditional: false },
  "Identity_Match_Decisions.Source_Staging_Type": { type: "ENUM", required: true, conditional: false },
  "Identity_Match_Decisions.Source_Staging_ID": { type: "ID", required: true, conditional: false },
  "Identity_Match_Decisions.Source_Staging_Hash": { type: "HEX64", required: true, conditional: false },
  "Identity_Match_Decisions.Parent_Product_Match_Decision_ID": { type: "ID", required: false, conditional: true },
  "Identity_Match_Decisions.Candidate_Canonical_ID": { type: "ID", required: false, conditional: false },
  "Identity_Match_Decisions.Decision": { type: "ENUM", required: true, conditional: false },
  "Identity_Match_Decisions.Result_Canonical_ID": { type: "ID", required: false, conditional: true },
  "Identity_Match_Decisions.Evidence_JSON_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Identity_Match_Decisions.Evidence_SHA256": { type: "HEX64", required: false, conditional: false },
  "Identity_Match_Decisions.Rationale": { type: "TEXT(1000)", required: true, conditional: false },
  "Identity_Match_Decisions.Decided_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Identity_Match_Decisions.Decided_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Identity_Match_Decisions.Supersedes_Decision_ID": { type: "ID", required: false, conditional: false },
  "Specifications.Specification_ID": { type: "ID", required: true, conditional: false },
  "Specifications.Source_Assertion_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Specifications.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Specifications.Scope": { type: "ENUM", required: true, conditional: false },
  "Specifications.Product_Source_Record_ID": { type: "ID", required: false, conditional: true },
  "Specifications.Variant_Source_Record_ID": { type: "ID", required: false, conditional: true },
  "Specifications.Product_ID": { type: "ID", required: true, conditional: false },
  "Specifications.Variant_ID": { type: "ID", required: false, conditional: true },
  "Specifications.Attribute_Key_Source": { type: "TEXT(160)", required: true, conditional: false },
  "Specifications.Attribute_Value_Source": { type: "TEXT(2000)", required: true, conditional: false },
  "Specifications.Unit_Source": { type: "TEXT(80)", required: false, conditional: false },
  "Specifications.Normalized_Key": { type: "TEXT(160)", required: false, conditional: false },
  "Specifications.Normalized_Value_JSON": { type: "JSON_TEXT(1000)", required: false, conditional: false },
  "Specifications.Normalized_Unit": { type: "TEXT(80)", required: false, conditional: false },
  "Specifications.Catalog_Page_ID": { type: "ID", required: true, conditional: false },
  "Specifications.Printed_Page_Label": { type: "TEXT(80)", required: false, conditional: false },
  "Specifications.Source_Section": { type: "TEXT(200)", required: false, conditional: false },
  "Specifications.Source_Quote": { type: "TEXT(2000)", required: false, conditional: false },
  "Specifications.Extraction_Run_ID": { type: "ID", required: true, conditional: false },
  "Specifications.Extraction_Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Specifications.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Specifications.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Product_Company.Product_ID": { type: "ID", required: true, conditional: false },
  "Product_Company.Product_Name_EN": { type: "TEXT(300)", required: false, conditional: false },
  "Product_Company.Product_Name_AR": { type: "TEXT(300)", required: false, conditional: false },
  "Product_Company.Company_Description": { type: "TEXT(4000)", required: false, conditional: false },
  "Product_Company.Manufacturer_or_Product_Brand_Label": { type: "TEXT(160)", required: false, conditional: false },
  "Product_Company.Product_Family_ID": { type: "ID", required: false, conditional: false },
  "Product_Company.Company_Notes": { type: "TEXT(4000)", required: false, conditional: false },
  "Product_Company.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Product_Company.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Variant_Company.Variant_ID": { type: "ID", required: true, conditional: false },
  "Variant_Company.Model_Name_EN": { type: "TEXT(250)", required: false, conditional: false },
  "Variant_Company.Model_Name_AR": { type: "TEXT(250)", required: false, conditional: false },
  "Variant_Company.Company_Model_Notes": { type: "TEXT(2000)", required: false, conditional: false },
  "Variant_Company.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Variant_Company.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Product_Families.Product_Family_ID": { type: "ID", required: true, conditional: false },
  "Product_Families.Family_Name_EN": { type: "TEXT(180)", required: true, conditional: false },
  "Product_Families.Family_Name_AR": { type: "TEXT(180)", required: false, conditional: false },
  "Product_Families.Parent_Family_ID": { type: "ID", required: false, conditional: false },
  "Product_Families.Description": { type: "TEXT(1000)", required: false, conditional: false },
  "Product_Families.Sort_Order": { type: "INTEGER", required: true, conditional: false },
  "Product_Families.Status": { type: "ENUM", required: true, conditional: false },
  "Product_Families.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Product_Families.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Attribute_Definitions.Attribute_ID": { type: "ID", required: true, conditional: false },
  "Attribute_Definitions.Attribute_Key": { type: "TEXT(100)", required: true, conditional: false },
  "Attribute_Definitions.Label_EN": { type: "TEXT(160)", required: true, conditional: false },
  "Attribute_Definitions.Label_AR": { type: "TEXT(160)", required: false, conditional: false },
  "Attribute_Definitions.Data_Type": { type: "ENUM", required: true, conditional: false },
  "Attribute_Definitions.Unit_Code": { type: "TEXT(40)", required: false, conditional: false },
  "Attribute_Definitions.Allowed_Values_JSON_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Attribute_Definitions.Allowed_Values_JSON": { type: "JSON_TEXT(4000)", required: false, conditional: false },
  "Attribute_Definitions.Applicable_Scope": { type: "ENUM", required: true, conditional: false },
  "Attribute_Definitions.Is_Required": { type: "BOOLEAN", required: true, conditional: false },
  "Attribute_Definitions.Validation_Rule_JSON": { type: "JSON_TEXT(2000)", required: false, conditional: false },
  "Attribute_Definitions.Display_Order": { type: "INTEGER", required: true, conditional: false },
  "Attribute_Definitions.Status": { type: "ENUM", required: true, conditional: false },
  "Attribute_Definitions.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Attribute_Definitions.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Product_Attributes.Product_Attribute_ID": { type: "ID", required: true, conditional: false },
  "Product_Attributes.Product_ID": { type: "ID", required: true, conditional: false },
  "Product_Attributes.Attribute_ID": { type: "ID", required: true, conditional: false },
  "Product_Attributes.Value_JSON": { type: "JSON_TEXT(2000)", required: true, conditional: false },
  "Product_Attributes.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Product_Attributes.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Variant_Attribute_Overrides.Variant_Override_ID": { type: "ID", required: true, conditional: false },
  "Variant_Attribute_Overrides.Variant_ID": { type: "ID", required: true, conditional: false },
  "Variant_Attribute_Overrides.Attribute_ID": { type: "ID", required: true, conditional: false },
  "Variant_Attribute_Overrides.Override_Mode": { type: "ENUM", required: true, conditional: false },
  "Variant_Attribute_Overrides.Value_JSON": { type: "JSON_TEXT(2000)", required: false, conditional: true },
  "Variant_Attribute_Overrides.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Variant_Attribute_Overrides.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Specification_Changes.Specification_Change_ID": { type: "ID", required: true, conditional: false },
  "Specification_Changes.Logical_Specification_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Specification_Changes.Sequence_No": { type: "INTEGER", required: false, conditional: true },
  "Specification_Changes.Operation": { type: "ENUM", required: true, conditional: false },
  "Specification_Changes.Target_Specification_ID": { type: "ID", required: false, conditional: true },
  "Specification_Changes.Product_ID": { type: "ID", required: true, conditional: false },
  "Specification_Changes.Variant_ID": { type: "ID", required: false, conditional: false },
  "Specification_Changes.Attribute_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Specification_Changes.Value_JSON": { type: "JSON_TEXT(2000)", required: false, conditional: true },
  "Specification_Changes.Unit_Code": { type: "TEXT(40)", required: false, conditional: false },
  "Specification_Changes.Change_Status": { type: "ENUM", required: true, conditional: false },
  "Specification_Changes.Reason": { type: "TEXT(1000)", required: true, conditional: false },
  "Specification_Changes.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Specification_Changes.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Specification_Changes.Approved_At": { type: "DATETIME_UTC", required: false, conditional: true },
  "Specification_Changes.Approved_By": { type: "ACTOR_ID", required: false, conditional: true },
  "Specification_Changes.Approval_Payload_SHA256": { type: "HEX64", required: false, conditional: true },
  "Documents.Doc_ID": { type: "ID", required: true, conditional: false },
  "Documents.Document_Type": { type: "ENUM", required: true, conditional: false },
  "Documents.Title": { type: "TEXT(250)", required: true, conditional: false },
  "Documents.Language_Code": { type: "TEXT(10)", required: false, conditional: false },
  "Documents.Description": { type: "TEXT(1500)", required: false, conditional: false },
  "Documents.Current_Version_ID": { type: "ID", required: false, conditional: false },
  "Documents.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Documents.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Documents.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Documents.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Documents.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Document_Versions.Version_ID": { type: "ID", required: true, conditional: false },
  "Document_Versions.Doc_ID": { type: "ID", required: true, conditional: false },
  "Document_Versions.Version_Label": { type: "TEXT(80)", required: true, conditional: false },
  "Document_Versions.Drive_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Document_Versions.Original_File_Name": { type: "TEXT(255)", required: true, conditional: false },
  "Document_Versions.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Document_Versions.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Document_Versions.SHA256": { type: "HEX64", required: true, conditional: false },
  "Document_Versions.Uploaded_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Document_Versions.Uploaded_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Document_Versions.Version_Notes": { type: "TEXT(1000)", required: false, conditional: false },
  "Document_Versions.Source_Type": { type: "ENUM", required: true, conditional: false },
  "Document_Versions.Source_Catalog_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Source_Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Source_Product_Source_Record_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Source_Variant_Source_Record_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Source_Quote": { type: "TEXT(2000)", required: false, conditional: false },
  "Document_Versions.Source_URL": { type: "URL(2000)", required: false, conditional: false },
  "Document_Versions.Extraction_Run_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Extraction_Record_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Supersedes_Version_ID": { type: "ID", required: false, conditional: false },
  "Document_Versions.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Document_Links.Link_ID": { type: "ID", required: true, conditional: false },
  "Document_Links.Doc_ID": { type: "ID", required: true, conditional: false },
  "Document_Links.Target_Type": { type: "ENUM", required: true, conditional: false },
  "Document_Links.Target_ID": { type: "ID", required: true, conditional: false },
  "Document_Links.Link_Mode": { type: "ENUM", required: true, conditional: false },
  "Document_Links.Pinned_Version_ID": { type: "ID", required: false, conditional: false },
  "Document_Links.Display_Order": { type: "INTEGER", required: true, conditional: false },
  "Document_Links.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Document_Links.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Document_Links.Link_Notes": { type: "TEXT(500)", required: false, conditional: false },
  "Image_Assets.Image_ID": { type: "ID", required: true, conditional: false },
  "Image_Assets.Original_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Image_Assets.Original_File_Name": { type: "TEXT(255)", required: true, conditional: false },
  "Image_Assets.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Image_Assets.Width_PX": { type: "INTEGER", required: true, conditional: false },
  "Image_Assets.Height_PX": { type: "INTEGER", required: true, conditional: false },
  "Image_Assets.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Image_Assets.Has_Alpha": { type: "BOOLEAN", required: true, conditional: false },
  "Image_Assets.Color_Space": { type: "ENUM", required: false, conditional: false },
  "Image_Assets.Orientation": { type: "ENUM", required: true, conditional: false },
  "Image_Assets.SHA256": { type: "HEX64", required: true, conditional: false },
  "Image_Assets.PHash": { type: "TEXT(64)", required: false, conditional: false },
  "Image_Assets.Source_Type": { type: "ENUM", required: true, conditional: false },
  "Image_Assets.Source_Catalog_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Source_Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Source_Product_Source_Record_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Source_Variant_Source_Record_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Source_Document_Version_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Source_Page_Label": { type: "TEXT(80)", required: false, conditional: false },
  "Image_Assets.Quality_Status": { type: "ENUM", required: true, conditional: false },
  "Image_Assets.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Image_Assets.Duplicate_Of_Image_ID": { type: "ID", required: false, conditional: false },
  "Image_Assets.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Image_Assets.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Image_Renditions.Image_Rendition_ID": { type: "ID", required: true, conditional: false },
  "Image_Renditions.Image_ID": { type: "ID", required: true, conditional: false },
  "Image_Renditions.Rendition_Type": { type: "ENUM", required: true, conditional: false },
  "Image_Renditions.Drive_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Image_Renditions.SHA256": { type: "HEX64", required: true, conditional: false },
  "Image_Renditions.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Image_Renditions.Width_PX": { type: "INTEGER", required: true, conditional: false },
  "Image_Renditions.Height_PX": { type: "INTEGER", required: true, conditional: false },
  "Image_Renditions.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Image_Renditions.Pipeline_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Image_Renditions.Source_SHA256": { type: "HEX64", required: true, conditional: false },
  "Image_Renditions.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Image_Links.Image_Link_ID": { type: "ID", required: true, conditional: false },
  "Image_Links.Image_ID": { type: "ID", required: true, conditional: false },
  "Image_Links.Catalog_Rendition_ID": { type: "ID", required: false, conditional: false },
  "Image_Links.DataSheet_Rendition_ID": { type: "ID", required: false, conditional: false },
  "Image_Links.Target_Type": { type: "ENUM", required: true, conditional: false },
  "Image_Links.Target_ID": { type: "ID", required: true, conditional: false },
  "Image_Links.Is_Primary": { type: "BOOLEAN", required: true, conditional: false },
  "Image_Links.Catalog_Approved": { type: "BOOLEAN", required: true, conditional: false },
  "Image_Links.DataSheet_Approved": { type: "BOOLEAN", required: true, conditional: false },
  "Image_Links.Catalog_Order": { type: "INTEGER", required: true, conditional: false },
  "Image_Links.DataSheet_Order": { type: "INTEGER", required: true, conditional: false },
  "Image_Links.Catalog_Crop_JSON": { type: "JSON_TEXT(1000)", required: false, conditional: false },
  "Image_Links.DataSheet_Crop_JSON": { type: "JSON_TEXT(1000)", required: false, conditional: false },
  "Image_Links.Link_Status": { type: "ENUM", required: true, conditional: false },
  "Image_Links.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Image_Links.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Image_Links.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Image_Links.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Image_Review_Pairs.Review_Pair_ID": { type: "ID", required: true, conditional: false },
  "Image_Review_Pairs.Image_A_ID": { type: "ID", required: true, conditional: false },
  "Image_Review_Pairs.Image_B_ID": { type: "ID", required: true, conditional: false },
  "Image_Review_Pairs.Algorithm": { type: "TEXT(80)", required: true, conditional: false },
  "Image_Review_Pairs.Distance": { type: "DECIMAL(12,6)", required: true, conditional: false },
  "Image_Review_Pairs.Decision": { type: "ENUM", required: true, conditional: false },
  "Image_Review_Pairs.Reviewed_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Image_Review_Pairs.Reviewed_By": { type: "ACTOR_ID", required: false, conditional: false },
  "Image_Review_Pairs.Notes": { type: "TEXT(1000)", required: false, conditional: false },
  "Design_Assets.Design_Asset_ID": { type: "ID", required: true, conditional: false },
  "Design_Assets.Asset_Type": { type: "ENUM", required: true, conditional: false },
  "Design_Assets.Asset_Name": { type: "TEXT(180)", required: true, conditional: false },
  "Design_Assets.Drive_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Design_Assets.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Design_Assets.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Design_Assets.SHA256": { type: "HEX64", required: true, conditional: false },
  "Design_Assets.License_Notes": { type: "TEXT(1000)", required: false, conditional: false },
  "Design_Assets.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Design_Assets.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Brands.Brand_ID": { type: "ID", required: true, conditional: false },
  "Brands.Brand_Name": { type: "TEXT(160)", required: true, conditional: false },
  "Brands.Description": { type: "TEXT(1000)", required: false, conditional: false },
  "Brands.Identity_Type": { type: "ENUM", required: true, conditional: false },
  "Brands.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Brands.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Brands.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Brand_Versions.Brand_Version_ID": { type: "ID", required: true, conditional: false },
  "Brand_Versions.Brand_ID": { type: "ID", required: true, conditional: false },
  "Brand_Versions.Version_Number": { type: "INTEGER", required: true, conditional: false },
  "Brand_Versions.Version_Status": { type: "ENUM", required: true, conditional: false },
  "Brand_Versions.Design_Config_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Brand_Versions.Config_SHA256": { type: "HEX64", required: true, conditional: false },
  "Brand_Versions.Published_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Brand_Versions.Published_By": { type: "ACTOR_ID", required: false, conditional: false },
  "Brand_Versions.Change_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Brand_Versions.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Brand_Versions.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Brand_Assets.Brand_Asset_ID": { type: "ID", required: true, conditional: false },
  "Brand_Assets.Brand_ID": { type: "ID", required: true, conditional: false },
  "Brand_Assets.Design_Asset_ID": { type: "ID", required: true, conditional: false },
  "Brand_Assets.Usage_Role": { type: "ENUM", required: true, conditional: false },
  "Brand_Assets.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Brand_Assets.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Brand_Assets.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Papers.Paper_ID": { type: "ID", required: true, conditional: false },
  "Papers.Paper_Name": { type: "TEXT(120)", required: true, conditional: false },
  "Papers.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Papers.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Papers.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Paper_Versions.Paper_Version_ID": { type: "ID", required: true, conditional: false },
  "Paper_Versions.Paper_ID": { type: "ID", required: true, conditional: false },
  "Paper_Versions.Version_Number": { type: "INTEGER", required: true, conditional: false },
  "Paper_Versions.Version_Status": { type: "ENUM", required: true, conditional: false },
  "Paper_Versions.Paper_Config_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Paper_Versions.Config_SHA256": { type: "HEX64", required: true, conditional: false },
  "Paper_Versions.Texture_Asset_ID": { type: "ID", required: false, conditional: true },
  "Paper_Versions.Texture_SHA256": { type: "HEX64", required: false, conditional: true },
  "Paper_Versions.Published_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Paper_Versions.Published_By": { type: "ACTOR_ID", required: false, conditional: false },
  "Paper_Versions.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Paper_Versions.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Templates.Template_ID": { type: "ID", required: true, conditional: false },
  "Templates.Template_Name": { type: "TEXT(160)", required: true, conditional: false },
  "Templates.Document_Type": { type: "ENUM", required: true, conditional: false },
  "Templates.Description": { type: "TEXT(1000)", required: false, conditional: false },
  "Templates.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Templates.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Templates.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Template_Versions.Template_Version_ID": { type: "ID", required: true, conditional: false },
  "Template_Versions.Template_ID": { type: "ID", required: true, conditional: false },
  "Template_Versions.Version_Number": { type: "INTEGER", required: true, conditional: false },
  "Template_Versions.Version_Status": { type: "ENUM", required: true, conditional: false },
  "Template_Versions.Template_Config_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Template_Versions.Config_SHA256": { type: "HEX64", required: true, conditional: false },
  "Template_Versions.Preview_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Template_Versions.Published_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Template_Versions.Published_By": { type: "ACTOR_ID", required: false, conditional: false },
  "Template_Versions.Change_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Template_Versions.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Template_Versions.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Template_Identity_Links.Template_Identity_Link_ID": { type: "ID", required: true, conditional: false },
  "Template_Identity_Links.Template_ID": { type: "ID", required: true, conditional: false },
  "Template_Identity_Links.Brand_ID": { type: "ID", required: true, conditional: false },
  "Template_Identity_Links.Is_Default": { type: "BOOLEAN", required: true, conditional: false },
  "Template_Identity_Links.Status": { type: "ENUM", required: true, conditional: false },
  "Template_Identity_Links.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Watermark_Presets.Watermark_ID": { type: "ID", required: true, conditional: false },
  "Watermark_Presets.Watermark_Name": { type: "TEXT(120)", required: true, conditional: false },
  "Watermark_Presets.Watermark_Type": { type: "ENUM", required: true, conditional: false },
  "Watermark_Presets.Text_Content": { type: "TEXT(250)", required: false, conditional: true },
  "Watermark_Presets.Design_Asset_ID": { type: "ID", required: false, conditional: true },
  "Watermark_Presets.Position": { type: "ENUM", required: true, conditional: false },
  "Watermark_Presets.Opacity": { type: "DECIMAL(4,3)", required: true, conditional: false },
  "Watermark_Presets.Rotation_Degrees": { type: "DECIMAL(6,2)", required: true, conditional: false },
  "Watermark_Presets.Width_Percent": { type: "DECIMAL(5,2)", required: false, conditional: false },
  "Watermark_Presets.Color_HEX": { type: "TEXT(9)", required: false, conditional: false },
  "Watermark_Presets.Layer": { type: "ENUM", required: true, conditional: false },
  "Watermark_Presets.Page_Application_JSON": { type: "JSON_TEXT(1000)", required: true, conditional: false },
  "Watermark_Presets.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Watermark_Presets.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Watermark_Presets.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Status_Defaults.Status_Default_ID": { type: "ID", required: true, conditional: false },
  "Status_Defaults.Document_Status": { type: "ENUM", required: true, conditional: false },
  "Status_Defaults.Suggested_Watermark_ID": { type: "ID", required: false, conditional: false },
  "Status_Defaults.Is_Active": { type: "BOOLEAN", required: true, conditional: false },
  "Status_Defaults.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Contact_Profiles.Contact_Profile_ID": { type: "ID", required: true, conditional: false },
  "Contact_Profiles.Profile_Name": { type: "TEXT(120)", required: true, conditional: false },
  "Contact_Profiles.Phone": { type: "TEXT(60)", required: false, conditional: false },
  "Contact_Profiles.Email": { type: "EMAIL", required: false, conditional: false },
  "Contact_Profiles.Website_URL": { type: "URL", required: false, conditional: false },
  "Contact_Profiles.LinkedIn_URL": { type: "URL", required: false, conditional: false },
  "Contact_Profiles.Facebook_URL": { type: "URL", required: false, conditional: false },
  "Contact_Profiles.Instagram_URL": { type: "URL", required: false, conditional: false },
  "Contact_Profiles.YouTube_URL": { type: "URL", required: false, conditional: false },
  "Contact_Profiles.Display_Config_JSON": { type: "JSON_TEXT(1500)", required: true, conditional: false },
  "Contact_Profiles.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Contact_Profiles.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Contact_Profiles.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Export_Profiles.Export_Profile_ID": { type: "ID", required: true, conditional: false },
  "Export_Profiles.Profile_Name": { type: "TEXT(120)", required: true, conditional: false },
  "Export_Profiles.Output_Class": { type: "ENUM", required: true, conditional: false },
  "Export_Profiles.Target_DPI": { type: "INTEGER", required: true, conditional: false },
  "Export_Profiles.Minimum_DPI_Warning": { type: "INTEGER", required: true, conditional: false },
  "Export_Profiles.Minimum_DPI_Block": { type: "INTEGER", required: false, conditional: false },
  "Export_Profiles.Color_Mode": { type: "ENUM", required: true, conditional: false },
  "Export_Profiles.PDF_Standard": { type: "ENUM", required: true, conditional: false },
  "Export_Profiles.Bleed_MM": { type: "DECIMAL(5,2)", required: true, conditional: false },
  "Export_Profiles.Safe_Margin_MM": { type: "DECIMAL(5,2)", required: true, conditional: false },
  "Export_Profiles.Embed_Fonts": { type: "BOOLEAN", required: true, conditional: false },
  "Export_Profiles.Compression_Config_JSON": { type: "JSON_TEXT(1500)", required: true, conditional: false },
  "Export_Profiles.Printer_Specification_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Export_Profiles.Printer_Spec_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Export_Profiles.Printer_Spec_SHA256": { type: "HEX64", required: false, conditional: false },
  "Export_Profiles.Color_Profile_Design_Asset_ID": { type: "ID", required: false, conditional: false },
  "Export_Profiles.Trim_Box_JSON": { type: "JSON_TEXT(500)", required: false, conditional: false },
  "Export_Profiles.Lifecycle_Status": { type: "ENUM", required: true, conditional: false },
  "Export_Profiles.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Export_Profiles.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Issued_Documents.Issued_Document_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Issue_Operation_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Issue_Number": { type: "TEXT(80)", required: true, conditional: false },
  "Issued_Documents.Document_Type": { type: "ENUM", required: true, conditional: false },
  "Issued_Documents.Product_ID": { type: "ID", required: false, conditional: false },
  "Issued_Documents.Variant_ID": { type: "ID", required: false, conditional: false },
  "Issued_Documents.Scope_Snapshot_JSON_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.Issue_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.Issue_Manifest_SHA256": { type: "HEX64", required: true, conditional: false },
  "Issued_Documents.Brand_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Brand_Version_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Template_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Template_Version_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Paper_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Paper_Version_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Watermark_ID": { type: "ID", required: false, conditional: false },
  "Issued_Documents.Document_Status": { type: "ENUM", required: true, conditional: false },
  "Issued_Documents.Contact_Profile_ID": { type: "ID", required: false, conditional: false },
  "Issued_Documents.Export_Profile_ID": { type: "ID", required: true, conditional: false },
  "Issued_Documents.Snapshot_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.Snapshot_SHA256": { type: "HEX64", required: true, conditional: false },
  "Issued_Documents.PDF_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.PDF_SHA256": { type: "HEX64", required: true, conditional: false },
  "Issued_Documents.Output_Class": { type: "ENUM", required: true, conditional: false },
  "Issued_Documents.Issued_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Issued_Documents.Issued_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Issued_Documents.Worker_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Issued_Documents.Chromium_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Issued_Documents.Playwright_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Issued_Documents.PDF_Renderer_Version": { type: "TEXT(120)", required: true, conditional: false },
  "Issued_Documents.Font_Fingerprints_JSON_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.Image_Processing_Version": { type: "TEXT(100)", required: true, conditional: false },
  "Issued_Documents.Preflight_Report_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issued_Documents.Issue_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Issued_Document_Items.Issued_Document_Item_ID": { type: "ID", required: true, conditional: false },
  "Issued_Document_Items.Issued_Document_ID": { type: "ID", required: true, conditional: false },
  "Issued_Document_Items.Item_Order": { type: "INTEGER", required: true, conditional: false },
  "Issued_Document_Items.Product_ID": { type: "ID", required: true, conditional: false },
  "Issued_Document_Items.Variant_ID": { type: "ID", required: false, conditional: false },
  "Issued_Document_Items.Item_Snapshot_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Issued_Document_Items.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Issue_Operations.Issue_Operation_ID": { type: "ID", required: true, conditional: false },
  "Issue_Operations.Issue_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Issue_Operations.Input_Fingerprint_SHA256": { type: "HEX64", required: true, conditional: false },
  "Issue_Operations.Run_ID": { type: "ID", required: true, conditional: false },
  "Issue_Operations.Source_Issued_Document_ID": { type: "ID", required: false, conditional: false },
  "Issue_Operations.Operation_Status": { type: "ENUM", required: true, conditional: false },
  "Issue_Operations.Intended_Issued_Document_ID": { type: "ID", required: true, conditional: false },
  "Issue_Operations.Scope_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Issue_Operations.Scope_Manifest_SHA256": { type: "HEX64", required: true, conditional: false },
  "Issue_Operations.Dependency_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Issue_Operations.Dependency_Manifest_SHA256": { type: "HEX64", required: false, conditional: false },
  "Issue_Operations.Rendered_PDF_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Issue_Operations.Rendered_PDF_SHA256": { type: "HEX64", required: false, conditional: false },
  "Issue_Operations.Preflight_Report_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Issue_Operations.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Issue_Operations.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Issue_Operations.Started_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Issue_Operations.Finished_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Issue_Operations.Error_Code": { type: "TEXT(80)", required: false, conditional: false },
  "Issue_Operations.Recovery_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Run_Log.Run_ID": { type: "ID", required: true, conditional: false },
  "Run_Log.Run_Type": { type: "ENUM", required: true, conditional: false },
  "Run_Log.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Run_Log.Logical_Job_ID": { type: "ID", required: true, conditional: false },
  "Run_Log.Parent_Run_ID": { type: "ID", required: false, conditional: false },
  "Run_Log.Attempt_Number": { type: "INTEGER", required: true, conditional: false },
  "Run_Log.Retry_Reason": { type: "TEXT(1000)", required: false, conditional: true },
  "Run_Log.Idempotency_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Run_Log.Run_Status": { type: "ENUM", required: true, conditional: false },
  "Run_Log.Current_Step": { type: "TEXT(120)", required: false, conditional: false },
  "Run_Log.Total_Units": { type: "INTEGER", required: false, conditional: false },
  "Run_Log.Completed_Units": { type: "INTEGER", required: true, conditional: false },
  "Run_Log.Failed_Units": { type: "INTEGER", required: true, conditional: false },
  "Run_Log.Worker_Version": { type: "TEXT(80)", required: false, conditional: false },
  "Run_Log.Started_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Log.Heartbeat_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Log.Worker_Lease_ID": { type: "TEXT(160)", required: false, conditional: false },
  "Run_Log.Lease_Expires_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Log.Finished_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Log.Error_Code": { type: "TEXT(80)", required: false, conditional: false },
  "Run_Log.Error_Summary": { type: "TEXT(1500)", required: false, conditional: false },
  "Run_Log.Input_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Run_Log.Output_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Run_Log.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Run_Log.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Run_Units.Run_Unit_ID": { type: "ID", required: true, conditional: false },
  "Run_Units.Run_ID": { type: "ID", required: true, conditional: false },
  "Run_Units.Unit_Type": { type: "ENUM", required: true, conditional: false },
  "Run_Units.Unit_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Run_Units.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Run_Units.Unit_Status": { type: "ENUM", required: true, conditional: false },
  "Run_Units.Input_SHA256": { type: "HEX64", required: true, conditional: false },
  "Run_Units.Output_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Run_Units.Output_SHA256": { type: "HEX64", required: false, conditional: false },
  "Run_Units.Reused_From_Run_Unit_ID": { type: "ID", required: false, conditional: false },
  "Run_Units.Attempt_Started_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Units.Attempt_Finished_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Run_Units.Error_Code": { type: "TEXT(80)", required: false, conditional: false },
  "Run_Units.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Run_Events.Run_Event_ID": { type: "ID", required: true, conditional: false },
  "Run_Events.Event_Idempotency_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Run_Events.Run_ID": { type: "ID", required: true, conditional: false },
  "Run_Events.Event_Type": { type: "ENUM", required: true, conditional: false },
  "Run_Events.Unit_Type": { type: "TEXT(80)", required: false, conditional: false },
  "Run_Events.Unit_Reference_ID": { type: "ID", required: false, conditional: false },
  "Run_Events.Progress_Count": { type: "INTEGER", required: false, conditional: false },
  "Run_Events.Message": { type: "TEXT(1500)", required: false, conditional: false },
  "Run_Events.Details_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Run_Events.Occurred_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Run_Events.Actor_ID": { type: "ACTOR_ID", required: true, conditional: false },
  "Staging_Products.Staging_ID": { type: "ID", required: true, conditional: false },
  "Staging_Products.Run_ID": { type: "ID", required: true, conditional: false },
  "Staging_Products.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Staging_Products.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Staging_Products.Source_Region": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Products.Raw_Extract_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Staging_Products.Extracted_Text": { type: "TEXT(4000)", required: false, conditional: false },
  "Staging_Products.Extraction_Method": { type: "ENUM", required: true, conditional: false },
  "Staging_Products.Extraction_Tool_Version": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Products.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Staging_Products.Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Products.Proposed_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Products.Staging_Record_Hash": { type: "HEX64", required: true, conditional: false },
  "Staging_Products.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Products.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Products.Proposed_Product_Name_EN": { type: "TEXT(300)", required: true, conditional: false },
  "Staging_Products.Proposed_Product_Reference": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Products.Candidate_Product_ID": { type: "ID", required: false, conditional: false },
  "Staging_Products.Identity_Match_Method": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Products.Match_Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Products.Source_Record_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Staging_Variants.Staging_ID": { type: "ID", required: true, conditional: false },
  "Staging_Variants.Run_ID": { type: "ID", required: true, conditional: false },
  "Staging_Variants.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Staging_Variants.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Staging_Variants.Source_Region": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Variants.Raw_Extract_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Staging_Variants.Extracted_Text": { type: "TEXT(4000)", required: false, conditional: false },
  "Staging_Variants.Extraction_Method": { type: "ENUM", required: true, conditional: false },
  "Staging_Variants.Extraction_Tool_Version": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Variants.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Staging_Variants.Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Variants.Proposed_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Variants.Staging_Record_Hash": { type: "HEX64", required: true, conditional: false },
  "Staging_Variants.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Variants.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Variants.Parent_Staging_Product_ID": { type: "ID", required: true, conditional: false },
  "Staging_Variants.Proposed_Model_Number": { type: "TEXT(160)", required: true, conditional: false },
  "Staging_Variants.Proposed_Model_Name": { type: "TEXT(250)", required: false, conditional: false },
  "Staging_Variants.Candidate_Variant_ID": { type: "ID", required: false, conditional: false },
  "Staging_Variants.Identity_Match_Method": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Variants.Match_Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Variants.Source_Record_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Staging_Specifications.Staging_ID": { type: "ID", required: true, conditional: false },
  "Staging_Specifications.Run_ID": { type: "ID", required: true, conditional: false },
  "Staging_Specifications.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Staging_Specifications.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Staging_Specifications.Source_Region": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Specifications.Raw_Extract_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Staging_Specifications.Extracted_Text": { type: "TEXT(4000)", required: false, conditional: false },
  "Staging_Specifications.Extraction_Method": { type: "ENUM", required: true, conditional: false },
  "Staging_Specifications.Extraction_Tool_Version": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Specifications.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: true, conditional: false },
  "Staging_Specifications.Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Specifications.Proposed_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Specifications.Staging_Record_Hash": { type: "HEX64", required: true, conditional: false },
  "Staging_Specifications.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Specifications.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Specifications.Parent_Staging_Product_ID": { type: "ID", required: true, conditional: false },
  "Staging_Specifications.Parent_Staging_Variant_ID": { type: "ID", required: false, conditional: false },
  "Staging_Specifications.Source_Assertion_Key": { type: "TEXT(160)", required: true, conditional: false },
  "Staging_Specifications.Scope": { type: "ENUM", required: true, conditional: false },
  "Staging_Specifications.Attribute_Key_Raw": { type: "TEXT(160)", required: true, conditional: false },
  "Staging_Specifications.Value_Raw": { type: "TEXT(2000)", required: true, conditional: false },
  "Staging_Specifications.Unit_Raw": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Specifications.Normalized_Key": { type: "TEXT(160)", required: false, conditional: false },
  "Staging_Specifications.Normalized_Value_JSON": { type: "JSON_TEXT(1000)", required: false, conditional: false },
  "Staging_Specifications.Normalized_Unit": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Specifications.Parse_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Images.Staging_ID": { type: "ID", required: true, conditional: false },
  "Staging_Images.Run_ID": { type: "ID", required: true, conditional: false },
  "Staging_Images.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Staging_Images.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Staging_Images.Source_Region": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Images.Raw_Extract_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Staging_Images.Extracted_Text": { type: "TEXT(4000)", required: false, conditional: false },
  "Staging_Images.Extraction_Method": { type: "ENUM", required: true, conditional: false },
  "Staging_Images.Extraction_Tool_Version": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Images.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Images.Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Images.Proposed_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Images.Staging_Record_Hash": { type: "HEX64", required: true, conditional: false },
  "Staging_Images.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Images.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Images.Proposed_Image_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Staging_Images.Original_File_Name": { type: "TEXT(255)", required: true, conditional: false },
  "Staging_Images.MIME_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Staging_Images.Width_PX": { type: "INTEGER", required: false, conditional: false },
  "Staging_Images.Height_PX": { type: "INTEGER", required: false, conditional: false },
  "Staging_Images.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Staging_Images.SHA256": { type: "HEX64", required: true, conditional: false },
  "Staging_Images.PHash": { type: "TEXT(64)", required: false, conditional: false },
  "Staging_Images.Candidate_Product_ID": { type: "ID", required: false, conditional: false },
  "Staging_Images.Candidate_Variant_ID": { type: "ID", required: false, conditional: false },
  "Staging_Images.Image_Role": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Images.Quality_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Documents.Staging_ID": { type: "ID", required: true, conditional: false },
  "Staging_Documents.Run_ID": { type: "ID", required: true, conditional: false },
  "Staging_Documents.Catalog_ID": { type: "ID", required: false, conditional: false },
  "Staging_Documents.Catalog_Page_ID": { type: "ID", required: false, conditional: false },
  "Staging_Documents.Source_Region": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Documents.Raw_Extract_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Staging_Documents.Extracted_Text": { type: "TEXT(4000)", required: false, conditional: false },
  "Staging_Documents.Extraction_Method": { type: "ENUM", required: true, conditional: false },
  "Staging_Documents.Extraction_Tool_Version": { type: "TEXT(120)", required: false, conditional: false },
  "Staging_Documents.Source_Key_Algorithm_Version": { type: "TEXT(80)", required: false, conditional: false },
  "Staging_Documents.Confidence": { type: "DECIMAL(5,4)", required: false, conditional: false },
  "Staging_Documents.Proposed_Status": { type: "ENUM", required: true, conditional: false },
  "Staging_Documents.Staging_Record_Hash": { type: "HEX64", required: true, conditional: false },
  "Staging_Documents.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Documents.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Staging_Documents.Proposed_Document_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Staging_Documents.Title": { type: "TEXT(250)", required: true, conditional: false },
  "Staging_Documents.Document_Type": { type: "ENUM", required: true, conditional: false },
  "Staging_Documents.Language_Code": { type: "TEXT(10)", required: false, conditional: false },
  "Staging_Documents.File_Size_Bytes": { type: "INTEGER", required: true, conditional: false },
  "Staging_Documents.SHA256": { type: "HEX64", required: true, conditional: false },
  "Staging_Documents.Candidate_Product_ID": { type: "ID", required: false, conditional: false },
  "Staging_Documents.Candidate_Variant_ID": { type: "ID", required: false, conditional: false },
  "Review_Queue.Review_Queue_ID": { type: "ID", required: true, conditional: false },
  "Review_Queue.Review_Type": { type: "ENUM", required: true, conditional: false },
  "Review_Queue.Priority": { type: "ENUM", required: true, conditional: false },
  "Review_Queue.Review_Status": { type: "ENUM", required: true, conditional: false },
  "Review_Queue.Proposed_Action": { type: "TEXT(500)", required: false, conditional: false },
  "Review_Queue.Decision_JSON_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Review_Queue.Decision_SHA256": { type: "HEX64", required: false, conditional: false },
  "Review_Queue.Staging_Set_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Review_Queue.Staging_Set_SHA256": { type: "HEX64", required: false, conditional: false },
  "Review_Queue.Reviewed_Payload_Hash": { type: "HEX64", required: false, conditional: false },
  "Review_Queue.Decision_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Review_Queue.Assigned_Actor_ID": { type: "ACTOR_ID", required: false, conditional: false },
  "Review_Queue.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Review_Queue.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Review_Queue.Reviewed_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Review_Queue.Reviewed_By": { type: "ACTOR_ID", required: false, conditional: false },
  "Audit_Log.Audit_ID": { type: "ID", required: true, conditional: false },
  "Audit_Log.Event_Idempotency_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Audit_Log.Payload_SHA256": { type: "HEX64", required: true, conditional: false },
  "Audit_Log.Event_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Audit_Log.Actor_ID": { type: "ACTOR_ID", required: true, conditional: false },
  "Audit_Log.Action": { type: "ENUM", required: true, conditional: false },
  "Audit_Log.Entity_Type": { type: "TEXT(100)", required: true, conditional: false },
  "Audit_Log.Entity_ID": { type: "ID", required: true, conditional: false },
  "Audit_Log.Field_Name": { type: "TEXT(120)", required: false, conditional: false },
  "Audit_Log.Before_Value_JSON": { type: "JSON_TEXT(3000)", required: false, conditional: false },
  "Audit_Log.After_Value_JSON": { type: "JSON_TEXT(3000)", required: false, conditional: false },
  "Audit_Log.Change_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: false, conditional: false },
  "Audit_Log.Reason": { type: "TEXT(1000)", required: false, conditional: false },
  "Audit_Log.Related_Run_ID": { type: "ID", required: false, conditional: false },
  "Audit_Log.Related_Review_ID": { type: "ID", required: false, conditional: false },
  "Review_Staging_Links.Review_Staging_Link_ID": { type: "ID", required: true, conditional: false },
  "Review_Staging_Links.Review_Queue_ID": { type: "ID", required: true, conditional: false },
  "Review_Staging_Links.Staging_ID": { type: "ID", required: true, conditional: false },
  "Review_Staging_Links.Review_Role": { type: "ENUM", required: true, conditional: false },
  "Review_Staging_Links.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Review_Staging_Links.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "System_Config.Config_ID": { type: "ID", required: true, conditional: false },
  "System_Config.Config_Key": { type: "TEXT(160)", required: true, conditional: false },
  "System_Config.Value_Type": { type: "ENUM", required: true, conditional: false },
  "System_Config.Value_Text": { type: "TEXT(4000)", required: true, conditional: false },
  "System_Config.Environment_ID": { type: "ENUM", required: true, conditional: false },
  "System_Config.Schema_Version": { type: "TEXT(40)", required: true, conditional: false },
  "System_Config.Is_Secret": { type: "BOOLEAN", required: true, conditional: false },
  "System_Config.Updated_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "System_Config.Updated_By": { type: "ACTOR_ID", required: true, conditional: false },
  "System_Config.Description": { type: "TEXT(500)", required: false, conditional: false },
  "Promotion_Operations.Promotion_Operation_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Operations.Promotion_Key": { type: "TEXT(180)", required: true, conditional: false },
  "Promotion_Operations.Run_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Operations.Operation_Status": { type: "ENUM", required: true, conditional: false },
  "Promotion_Operations.Staging_Set_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Promotion_Operations.Staging_Set_SHA256": { type: "HEX64", required: true, conditional: false },
  "Promotion_Operations.Intended_Output_Manifest_File_ID": { type: "DRIVE_FILE_ID", required: true, conditional: false },
  "Promotion_Operations.Intended_Output_SHA256": { type: "HEX64", required: true, conditional: false },
  "Promotion_Operations.Created_At": { type: "DATETIME_UTC", required: true, conditional: false },
  "Promotion_Operations.Created_By": { type: "ACTOR_ID", required: true, conditional: false },
  "Promotion_Operations.Started_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Promotion_Operations.Finished_At": { type: "DATETIME_UTC", required: false, conditional: false },
  "Promotion_Operations.Recovery_Notes": { type: "TEXT(1500)", required: false, conditional: false },
  "Promotion_Mappings.Promotion_Mapping_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Mappings.Promotion_Operation_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Mappings.Staging_Type": { type: "ENUM", required: true, conditional: false },
  "Promotion_Mappings.Staging_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Mappings.Production_Entity_Type": { type: "ENUM", required: true, conditional: false },
  "Promotion_Mappings.Production_Entity_ID": { type: "ID", required: true, conditional: false },
  "Promotion_Mappings.Canonical_Entity_Type": { type: "ENUM", required: false, conditional: false },
  "Promotion_Mappings.Canonical_Entity_ID": { type: "ID", required: false, conditional: false },
  "Promotion_Mappings.Identity_Match_Decision_ID": { type: "ID", required: false, conditional: false },
  "Promotion_Mappings.Payload_SHA256": { type: "HEX64", required: true, conditional: false },
  "Promotion_Mappings.Created_At": { type: "DATETIME_UTC", required: true, conditional: false }
});


// ===== repositories/SheetsRepository.js =====

var SheetsRepository = (function () {
  function spreadsheet_() {
    var id = PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID");
    if (!id) throw new Error("CONFIG_MISSING: DEV_SPREADSHEET_ID");
    return SpreadsheetApp.openById(id);
  }
  function initialize() {
    var ss = spreadsheet_();
    Object.keys(TABLES).forEach(function (name) {
      var headers = TABLES[name];
      var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      } else {
        var lastColumn = sheet.getLastColumn();
        var existing = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
        if (lastColumn !== headers.length || JSON.stringify(existing) !== JSON.stringify(headers)) {
          throw new Error("SCHEMA_MISMATCH: " + name + " header differs; no automatic rewrite performed");
        }
      }
    });
    PropertiesService.getScriptProperties().setProperty("APP_SCHEMA_VERSION", APP.SCHEMA_VERSION);
    return { spreadsheetId: ss.getId(), schemaVersion: APP.SCHEMA_VERSION, tables: Object.keys(TABLES) };
  }
  function safeCell_(value) {
    if (typeof value !== "string") return value === undefined || value === null ? "" : value;
    if (value === "") return "";
    // Prevent untrusted supplier/browser text from being interpreted as a Sheets formula.
    var first = value.trim().charAt(0);
    return "=+@-".indexOf(first) >= 0 ? "'" + value : value;
  }
  function enumKey_(tableName, columnName) {
    var directKey = tableName + "." + columnName;
    if (Object.prototype.hasOwnProperty.call(ENUMS, directKey)) return directKey;
    if (tableName.indexOf("Staging_") === 0) {
      var commonKey = "Common staging envelope (all Staging_* sheets)." + columnName;
      if (Object.prototype.hasOwnProperty.call(ENUMS, commonKey)) return commonKey;
    }
    return null;
  }
  function validateEnums_(tableName, record, headers) {
    headers.forEach(function (column) {
      var key = enumKey_(tableName, column);
      if (!key) return;
      var value = Object.prototype.hasOwnProperty.call(record, column) ? record[column] : "";
      var blank = value === "" || value === null || value === undefined;
      if (ENUM_REQUIRED[key] && blank) throw new Error("VALIDATION_REQUIRED: " + tableName + "." + column);
      if (!blank && ENUMS[key].indexOf(String(value)) < 0) {
        throw new Error("VALIDATION_INVALID_ENUM: " + tableName + "." + column);
      }
    });
  }
  function validateFieldValue_(tableName, column, value, type) {
    var errorCode = "VALIDATION_INVALID_TYPE: " + tableName + "." + column;
    if (type === "ENUM") {
      var key = enumKey_(tableName, column);
      if (!key || ENUMS[key].indexOf(String(value)) < 0) throw new Error("VALIDATION_INVALID_ENUM: " + tableName + "." + column);
      return;
    }
    if (type === "INTEGER") {
      if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(errorCode);
      return;
    }
    if (type.indexOf("DECIMAL(") === 0) {
      if (typeof value !== "number" || !isFinite(value)) throw new Error(errorCode);
      return;
    }
    if (type === "BOOLEAN") {
      if (typeof value !== "boolean") throw new Error(errorCode);
      if (tableName === "System_Config" && column === "Is_Secret" && value !== false) throw new Error("SECRET_CONFIG_FORBIDDEN");
      return;
    }
    if (type === "HEX64") {
      if (typeof value !== "string" || value.length !== 64 || !/^[0-9a-f]{64}$/.test(value)) throw new Error(errorCode);
      return;
    }
    if (type === "DATE") {
      if (value instanceof Date) { if (isNaN(value.getTime())) throw new Error(errorCode); return; }
      if (typeof value !== "string") throw new Error(errorCode);
      var dateParts = value.split("-");
      if (dateParts.length !== 3 || dateParts[0].length !== 4 || dateParts[1].length !== 2 || dateParts[2].length !== 2) throw new Error(errorCode);
      var year = Number(dateParts[0]), month = Number(dateParts[1]), day = Number(dateParts[2]);
      var date = new Date(Date.UTC(year, month - 1, day));
      if (!year || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error(errorCode);
      return;
    }
    if (type === "DATETIME_UTC") {
      if (typeof value !== "string" || value.indexOf("T") < 0 || value.charAt(value.length - 1) !== "Z" || isNaN(Date.parse(value))) throw new Error(errorCode);
      return;
    }
    if (type === "URL") {
      if (typeof value !== "string") throw new Error(errorCode);
      var lowerUrl = value.toLowerCase();
      var protocolLength = lowerUrl.indexOf("https://") === 0 ? 8 : (lowerUrl.indexOf("http://") === 0 ? 7 : 0);
      var authority = protocolLength ? value.substring(protocolLength).split("/")[0].split("?")[0].split("#")[0] : "";
      if (!protocolLength || !authority || value.split("").some(function (ch) { return ch.charCodeAt(0) <= 32; })) throw new Error(errorCode);
      return;
    }
    if (type === "EMAIL") {
      if (typeof value !== "string" || value.indexOf("@") <= 0 || value.lastIndexOf(".") < value.indexOf("@") + 2) throw new Error(errorCode);
      return;
    }
    if (type === "ID" || type === "ACTOR_ID" || type === "DRIVE_FILE_ID" || type === "JSON_FILE_ID") {
      if (typeof value !== "string" || !value.trim()) throw new Error(errorCode);
      if ((type === "DRIVE_FILE_ID" || type === "JSON_FILE_ID") && !/^[A-Za-z0-9_-]{10,200}$/.test(value)) throw new Error(errorCode);
      return;
    }
    var textLimit = type.indexOf("TEXT(") === 0 ? Number(type.slice(5, -1)) : 0;
    var jsonLimit = type.indexOf("JSON_TEXT(") === 0 ? Number(type.slice(10, -1)) : 0;
    if (textLimit) {
      if (typeof value !== "string" || value.length > textLimit) throw new Error(errorCode);
      return;
    }
    if (jsonLimit) {
      if (typeof value !== "string" || value.length > jsonLimit) throw new Error(errorCode);
      try { JSON.parse(value); } catch (err) { throw new Error("VALIDATION_INVALID_JSON: " + tableName + "." + column); }
      return;
    }
    throw new Error("SCHEMA_UNSUPPORTED_FIELD_TYPE: " + type);
  }
  function validateRecord_(tableName, record, headers) {
    headers.forEach(function (column) {
      var key = tableName + "." + column;
      var rule = FIELD_RULES[key];
      if (!rule) throw new Error("SCHEMA_FIELD_RULE_MISSING: " + key);
      var value = Object.prototype.hasOwnProperty.call(record, column) ? record[column] : "";
      var blank = value === "" || value === null || value === undefined || (typeof value === "string" && !value.trim());
      if (rule.required && blank) throw new Error("VALIDATION_REQUIRED: " + key);
      if (!blank) validateFieldValue_(tableName, column, value, rule.type);
    });
  }
  function append(name, record) {
    if (!TABLES[name]) throw new Error("UNKNOWN_TABLE: " + name);
    if (!record || Object.prototype.toString.call(record) !== "[object Object]") {
      throw new Error("INVALID_RECORD");
    }
    var headers = TABLES[name];
    Object.keys(record).forEach(function (key) {
      if (headers.indexOf(key) < 0) throw new Error("UNKNOWN_COLUMN: " + name + "." + key);
    });
    validateRecord_(name, record, headers);
    validateEnums_(name, record, headers);
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet) throw new Error("SCHEMA_NOT_INITIALIZED: " + name);
    var row = headers.map(function (key) {
      return safeCell_(Object.prototype.hasOwnProperty.call(record, key) ? record[key] : "");
    });
    var rowNumber = sheet.getLastRow() + 1;
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    return rowNumber;
  }
  function getBy(name, column, value) {
    var headers = TABLES[name];
    if (!headers || headers.indexOf(column) < 0) throw new Error("INVALID_LOOKUP");
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return null;
    var col = headers.indexOf(column) + 1;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][col - 1]) === String(value)) {
        var record = {};
        headers.forEach(function (header, index) { record[header] = values[i][index]; });
        return record;
      }
    }
    return null;
  }
  function listRecent(name, limit) {
    var headers = TABLES[name];
    if (!headers) throw new Error("UNKNOWN_TABLE: " + name);
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var rowCount = sheet.getLastRow() - 1;
    var startRow = Math.max(2, sheet.getLastRow() - Math.max(1, Number(limit) || 30) + 1);
    var values = sheet.getRange(startRow, 1, sheet.getLastRow() - startRow + 1, headers.length).getValues();
    return values.reverse().map(function (row) {
      var record = {};
      headers.forEach(function (header, index) {
        var value = row[index];
        record[header] = value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value;
      });
      return record;
    });
  }
  function listAll(name) {
    var headers = TABLES[name];
    if (!headers) throw new Error("UNKNOWN_TABLE: " + name);
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    return values.reverse().map(function (row) {
      var record = {};
      headers.forEach(function (header, index) {
        var value = row[index];
        record[header] = value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value;
      });
      return record;
    });
  }
  function findBy(name, column, value) {
    var headers = TABLES[name];
    if (!headers || headers.indexOf(column) < 0) throw new Error("INVALID_LOOKUP");
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return null;
    var col = headers.indexOf(column) + 1;
    var values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) if (String(values[i][0]) === String(value)) return i + 2;
    return null;
  }
  function updateBy(name, keyColumn, keyValue, patch) {
    if (!TABLES[name] || !patch || Object.prototype.toString.call(patch) !== "[object Object]") {
      throw new Error("INVALID_UPDATE");
    }
    var headers = TABLES[name];
    var rowNumber = findBy(name, keyColumn, keyValue);
    if (!rowNumber) throw new Error("ROW_NOT_FOUND: " + name);
    var sheet = spreadsheet_().getSheetByName(name);
    var row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    Object.keys(patch).forEach(function (column) {
      var index = headers.indexOf(column);
      if (index < 0) throw new Error("UNKNOWN_COLUMN: " + name + "." + column);
      if (column === keyColumn || column === "Created_At" || column === "Created_By") {
        throw new Error("IMMUTABLE_COLUMN: " + name + "." + column);
      }
      var rule = FIELD_RULES[name + "." + column];
      if (!rule) throw new Error("SCHEMA_FIELD_RULE_MISSING: " + name + "." + column);
      var value = patch[column];
      var blank = value === "" || value === null || value === undefined ||
        (typeof value === "string" && !value.trim());
      if (rule.required && blank) throw new Error("VALIDATION_REQUIRED: " + name + "." + column);
      if (!blank) validateFieldValue_(name, column, value, rule.type);
      var enumKey = enumKey_(name, column);
      if (enumKey && !blank && ENUMS[enumKey].indexOf(String(value)) < 0) {
        throw new Error("VALIDATION_INVALID_ENUM: " + name + "." + column);
      }
      row[index] = safeCell_(blank ? "" : value);
    });
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    return rowNumber;
  }
  return { listAll: listAll, updateBy: updateBy, initialize: initialize, append: append, findBy: findBy, getBy: getBy, listRecent: listRecent, validateEnums: validateEnums_, validateRecord: validateRecord_ };
})();


// ===== security/Auth.js =====

/**
 * Defense in depth: the deployed web app must remain restricted to the owner.
 * With executeAs=USER_DEPLOYING, the effective user is the deploying account.
 * Fail closed if Apps Script does not expose that identity.
 */
function assertPrimaryUser_() {
  var props = PropertiesService.getScriptProperties();
  var expected = (props.getProperty("ALLOWED_USER_EMAIL") || "").trim().toLowerCase();
  var actual = (Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
  if (!expected) throw new Error("AUTH_NOT_CONFIGURED");
  if (!actual) throw new Error("AUTH_IDENTITY_UNAVAILABLE");
  if (actual !== expected) throw new Error("UNAUTHORIZED");
  return APP.ACTOR_ID;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}


// ===== validation/InputValidation.js =====

/**
 * Boundary validation for untrusted browser/API input.
 * Pure JavaScript: no Apps Script services, so rules can be tested independently.
 */
var InputValidation = (function () {
  function isPlainObject_(value) {
    return value !== null && typeof value === "object" && Object.prototype.toString.call(value) === "[object Object]";
  }
  function requiredString_(value, field, maxLength) {
    if (typeof value !== "string" || !value.trim()) throw new Error("VALIDATION_REQUIRED: " + field);
    var normalized = value.trim();
    if (normalized.length > maxLength) throw new Error("VALIDATION_TOO_LONG: " + field);
    return normalized;
  }
  function optionalString_(value, field, maxLength) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") throw new Error("VALIDATION_INVALID_TYPE: " + field);
    var normalized = value.trim();
    if (normalized.length > maxLength) throw new Error("VALIDATION_TOO_LONG: " + field);
    return normalized;
  }
  function uploadMetadata_(payload) {
    if (!isPlainObject_(payload)) throw new Error("INVALID_UPLOAD_PAYLOAD");
    var allowed = ["supplierName", "catalogTitle", "catalogRevision", "fileName", "mimeType", "base64"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var fileName = requiredString_(payload.fileName, "fileName", 180);
    fileName = fileName.replace(/[\\/:*?"<>|]/g, "_");
    if (!/\.pdf$/i.test(fileName)) throw new Error("INVALID_PDF_FILENAME");
    if (payload.mimeType && payload.mimeType !== "application/pdf") throw new Error("UNSUPPORTED_MIME_TYPE");
    var base64 = requiredString_(payload.base64, "base64", 16777216);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error("INVALID_BASE64");
    return {
      supplierName: requiredString_(payload.supplierName, "supplierName", 160),
      catalogTitle: optionalString_(payload.catalogTitle, "catalogTitle", 240),
      catalogRevision: optionalString_(payload.catalogRevision, "catalogRevision", 80),
      fileName: fileName,
      base64: base64
    };
  }
  function catalogPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["driveFileId","supplierName","catalogTitle","catalogReference","catalogRevision","languageCode","publishedDate","sourceUrl","notes"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var driveFileId = requiredString_(payload.driveFileId, "driveFileId", 200);
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(driveFileId)) throw new Error("VALIDATION_INVALID_FORMAT: driveFileId");
    var publishedDate = optionalString_(payload.publishedDate, "publishedDate", 10);
    if (publishedDate) {
      var parts = publishedDate.split("-");
      if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
        throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      }
      var year = Number(parts[0]), month = Number(parts[1]), day = Number(parts[2]);
      var date = new Date(Date.UTC(year, month - 1, day));
      if (!year || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      }
    }
    var languageCode = optionalString_(payload.languageCode, "languageCode", 12);
    if (languageCode && !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(languageCode)) throw new Error("VALIDATION_INVALID_FORMAT: languageCode");
    var sourceUrl = optionalString_(payload.sourceUrl, "sourceUrl", 2048);
    if (sourceUrl) {
      var lowerUrl = sourceUrl.toLowerCase();
      var protocolLength = lowerUrl.indexOf("https://") === 0 ? 8 : (lowerUrl.indexOf("http://") === 0 ? 7 : 0);
      var authority = protocolLength ? sourceUrl.substring(protocolLength).split("/")[0].split("?")[0].split("#")[0] : "";
      var hasControlOrSpace = sourceUrl.split("").some(function (character) { return character.charCodeAt(0) <= 32; });
      if (!protocolLength || !authority || hasControlOrSpace) throw new Error("VALIDATION_INVALID_FORMAT: sourceUrl");
    }
    return {
      driveFileId: driveFileId,
      supplierName: requiredString_(payload.supplierName, "supplierName", 160),
      catalogTitle: optionalString_(payload.catalogTitle, "catalogTitle", 240),
      catalogReference: optionalString_(payload.catalogReference, "catalogReference", 120),
      catalogRevision: optionalString_(payload.catalogRevision, "catalogRevision", 80),
      languageCode: languageCode,
      publishedDate: publishedDate,
      sourceUrl: sourceUrl,
      notes: optionalString_(payload.notes, "notes", 2000)
    };
  }
  return { catalogPayload: catalogPayload_, uploadMetadata: uploadMetadata_ };
})();


// ===== domain/ProductService.js =====

/** Product domain service — canonical identity + company fields.
 * Does not create source records or specifications.
 */
var ProductService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }
  function require_(c, code) { if (!c) throw new Error(code); }
  function audit_(actor, action, entityType, entityId, reason) {
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityType + "|" + entityId + "|" + now_()),
      Event_Idempotency_Key: text_(action + "|" + entityId, 180),
      Payload_SHA256: sha_(entityId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: text_(reason, 1000)
    });
  }

  function create(options) {
    require_(options && options.actor, "PRODUCT_ACTOR_REQUIRED");
    var productId = stableId_("prd", options.idempotencyKey || Utilities.getUuid());
    var existing = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (existing) {
      var company = SheetsRepository.getBy("Product_Company", "Product_ID", productId) || {};
      if (options.nameEn && company.Product_Name_EN && company.Product_Name_EN !== text_(options.nameEn, 300)) {
        throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");
      }
      return { productId: productId, reused: true };
    }
    SheetsRepository.append("Products", {
      Product_ID: productId,
      Lifecycle_Status: "ACTIVE",
      Canonical_Notes: text_(options.notes, 2000),
      Created_At: now_(),
      Created_By: options.actor
    });
    SheetsRepository.append("Product_Company", {
      Product_ID: productId,
      Product_Name_EN: text_(options.nameEn, 300),
      Product_Name_AR: text_(options.nameAr, 300),
      Company_Description: text_(options.description, 4000),
      Manufacturer_or_Product_Brand_Label: text_(options.brandLabel, 160),
      Product_Family_ID: options.familyId || "",
      Company_Notes: text_(options.notes, 4000),
      Updated_At: now_(),
      Updated_By: options.actor
    });
    audit_(options.actor, "CREATE", "PRODUCT", productId, "Manual product created");
    return { productId: productId, reused: false };
  }

  function getWorkspace(productId) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    var company = SheetsRepository.getBy("Product_Company", "Product_ID", productId) || {};
    var variants = (SheetsRepository.listAll("Variants") || []).filter(function (v) { return v.Product_ID === productId; });
    return { product: product, company: company, variants: variants };
  }

  function search(query) {
    var q = (query || "").toLowerCase().trim();
    if (!q) return [];
    var companies = SheetsRepository.listAll("Product_Company") || [];
    var products = SheetsRepository.listAll("Products") || [];
    var byId = {};
    products.forEach(function (p) { byId[p.Product_ID] = p; });
    return companies.filter(function (c) {
      var name = ((c.Product_Name_EN || "") + " " + (c.Product_Name_AR || "")).toLowerCase();
      return name.indexOf(q) >= 0;
    }).map(function (c) {
      return { productId: c.Product_ID, nameEn: c.Product_Name_EN, nameAr: c.Product_Name_AR, status: (byId[c.Product_ID] || {}).Lifecycle_Status };
    }).slice(0, 50);
  }

  function updateCompany(productId, fields, actor) {
    require_(SheetsRepository.getBy("Products", "Product_ID", productId), "PRODUCT_NOT_FOUND");
    var patch = { Updated_At: now_(), Updated_By: actor };
    if (fields.nameEn !== undefined) patch.Product_Name_EN = text_(fields.nameEn, 300);
    if (fields.nameAr !== undefined) patch.Product_Name_AR = text_(fields.nameAr, 300);
    if (fields.description !== undefined) patch.Company_Description = text_(fields.description, 4000);
    if (fields.brandLabel !== undefined) patch.Manufacturer_or_Product_Brand_Label = text_(fields.brandLabel, 160);
    if (fields.notes !== undefined) patch.Company_Notes = text_(fields.notes, 4000);
    if (fields.familyId !== undefined) patch.Product_Family_ID = fields.familyId || "";
    SheetsRepository.updateBy("Product_Company", "Product_ID", productId, patch);
    audit_(actor, "UPDATE", "PRODUCT_COMPANY", productId, "Company fields updated");
    return { ok: true };
  }

  function archive(productId, actor) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    var activeVariants = (SheetsRepository.listAll("Variants") || []).filter(function (v) {
      return v.Product_ID === productId && v.Lifecycle_Status === "ACTIVE";
    });
    require_(activeVariants.length === 0, "PRODUCT_HAS_ACTIVE_VARIANTS");
    SheetsRepository.updateBy("Products", "Product_ID", productId, { Lifecycle_Status: "ARCHIVED" });
    audit_(actor, "ARCHIVE", "PRODUCT", productId, "Product archived");
    return { ok: true };
  }

  function reactivate(productId, actor) {
    require_(SheetsRepository.getBy("Products", "Product_ID", productId), "PRODUCT_NOT_FOUND");
    SheetsRepository.updateBy("Products", "Product_ID", productId, { Lifecycle_Status: "ACTIVE" });
    audit_(actor, "REACTIVATE", "PRODUCT", productId, "Product reactivated");
    return { ok: true };
  }

  return { create: create, getWorkspace: getWorkspace, search: search, updateCompany: updateCompany, archive: archive, reactivate: reactivate };
})();


// ===== domain/ProductFamilyService.js =====

/** Product family hierarchy.
 * Cycle prevention, dependency-safe archive, no physical deletion.
 */
var ProductFamilyService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }

  function create(nameEn, nameAr, parentId, actor) {
    require_(nameEn && actor, "FAMILY_ARGUMENTS_INVALID");
    if (parentId) {
      var parent = SheetsRepository.getBy("Product_Families", "Product_Family_ID", parentId);
      require_(parent && parent.Status === "ACTIVE", "PARENT_FAMILY_NOT_ACTIVE");
    }
    var id = stableId_("fam", nameEn + "|" + (parentId || "root") + "|" + (actor || ""));
    if (SheetsRepository.getBy("Product_Families", "Product_Family_ID", id)) {
      return { familyId: id, reused: true };
    }
    SheetsRepository.append("Product_Families", {
      Product_Family_ID: id,
      Family_Name_EN: text_(nameEn, 180),
      Family_Name_AR: text_(nameAr, 180),
      Parent_Family_ID: parentId || "",
      Description: "",
      Sort_Order: 0,
      Status: "ACTIVE",
      Created_At: now_(),
      Updated_At: now_()
    });
    return { familyId: id, reused: false };
  }

  function wouldCycle_(familyId, newParentId) {
    if (!newParentId) return false;
    var current = newParentId;
    var seen = {};
    var depth = 0;
    while (current && depth < 50) {
      if (current === familyId || seen[current]) return true;
      seen[current] = true;
      var f = SheetsRepository.getBy("Product_Families", "Product_Family_ID", current);
      current = f ? f.Parent_Family_ID : null;
      depth++;
    }
    return false;
  }

  function updateParent(familyId, newParentId, actor) {
    require_(SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId), "FAMILY_NOT_FOUND");
    require_(!wouldCycle_(familyId, newParentId), "FAMILY_CYCLE_DETECTED");
    if (newParentId) {
      var parent = SheetsRepository.getBy("Product_Families", "Product_Family_ID", newParentId);
      require_(parent && parent.Status === "ACTIVE", "PARENT_FAMILY_NOT_ACTIVE");
    }
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, {
      Parent_Family_ID: newParentId || "",
      Updated_At: now_()
    });
    return { ok: true };
  }

  function archive(familyId, actor) {
    var family = SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId);
    require_(family, "FAMILY_NOT_FOUND");
    var activeChildren = (SheetsRepository.listAll("Product_Families") || []).filter(function (f) {
      return f.Parent_Family_ID === familyId && f.Status === "ACTIVE";
    });
    require_(activeChildren.length === 0, "FAMILY_HAS_ACTIVE_CHILDREN");
    var activeProducts = (SheetsRepository.listAll("Product_Company") || []).filter(function (pc) {
      return pc.Product_Family_ID === familyId;
    }).filter(function (pc) {
      var p = SheetsRepository.getBy("Products", "Product_ID", pc.Product_ID);
      return p && p.Lifecycle_Status === "ACTIVE";
    });
    require_(activeProducts.length === 0, "FAMILY_HAS_ACTIVE_PRODUCTS");
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, { Status: "ARCHIVED", Updated_At: now_() });
    return { ok: true };
  }

  function reactivate(familyId, actor) {
    require_(SheetsRepository.getBy("Product_Families", "Product_Family_ID", familyId), "FAMILY_NOT_FOUND");
    SheetsRepository.updateBy("Product_Families", "Product_Family_ID", familyId, { Status: "ACTIVE", Updated_At: now_() });
    return { ok: true };
  }

  return { create: create, updateParent: updateParent, archive: archive, reactivate: reactivate };
})();


// ===== domain/VariantService.js =====

/** Variant domain service. Product_ID is immutable (ADR-035). */
var VariantService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }
  function require_(c, code) { if (!c) throw new Error(code); }
  function audit_(actor, action, entityType, entityId, reason) {
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityType + "|" + entityId + "|" + now_()),
      Event_Idempotency_Key: text_(action + "|" + entityId, 180),
      Payload_SHA256: sha_(entityId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: text_(reason, 1000)
    });
  }

  function create(productId, options) {
    require_(options && options.actor, "VARIANT_ACTOR_REQUIRED");
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    require_(product.Lifecycle_Status === "ACTIVE", "PRODUCT_NOT_ACTIVE");
    var variantId = stableId_("var", productId + "|" + (options.idempotencyKey || Utilities.getUuid()));
    if (SheetsRepository.getBy("Variants", "Variant_ID", variantId)) return { variantId: variantId, reused: true };
    SheetsRepository.append("Variants", {
      Variant_ID: variantId,
      Product_ID: productId,
      Lifecycle_Status: "ACTIVE",
      Canonical_Notes: text_(options.notes, 2000),
      Created_At: now_(),
      Created_By: options.actor
    });
    SheetsRepository.append("Variant_Company", {
      Variant_ID: variantId,
      Model_Name_EN: text_(options.modelNameEn, 250),
      Model_Name_AR: text_(options.modelNameAr, 250),
      Company_Model_Notes: text_(options.notes, 2000),
      Updated_At: now_(),
      Updated_By: options.actor
    });
    audit_(options.actor, "CREATE", "VARIANT", variantId, "Variant created under product");
    return { variantId: variantId, reused: false };
  }

  function updateCompany(variantId, fields, actor) {
    require_(SheetsRepository.getBy("Variants", "Variant_ID", variantId), "VARIANT_NOT_FOUND");
    var patch = { Updated_At: now_(), Updated_By: actor };
    if (fields.modelNameEn !== undefined) patch.Model_Name_EN = text_(fields.modelNameEn, 250);
    if (fields.modelNameAr !== undefined) patch.Model_Name_AR = text_(fields.modelNameAr, 250);
    if (fields.notes !== undefined) patch.Company_Model_Notes = text_(fields.notes, 2000);
    SheetsRepository.updateBy("Variant_Company", "Variant_ID", variantId, patch);
    audit_(actor, "UPDATE", "VARIANT_COMPANY", variantId, "Variant company fields updated");
    return { ok: true };
  }

  function archive(variantId, actor) {
    require_(SheetsRepository.getBy("Variants", "Variant_ID", variantId), "VARIANT_NOT_FOUND");
    SheetsRepository.updateBy("Variants", "Variant_ID", variantId, { Lifecycle_Status: "ARCHIVED" });
    audit_(actor, "ARCHIVE", "VARIANT", variantId, "Variant archived");
    return { ok: true };
  }

  function reactivate(variantId, actor) {
    var variant = SheetsRepository.getBy("Variants", "Variant_ID", variantId);
    require_(variant, "VARIANT_NOT_FOUND");
    var product = SheetsRepository.getBy("Products", "Product_ID", variant.Product_ID);
    require_(product && product.Lifecycle_Status === "ACTIVE", "PARENT_PRODUCT_NOT_ACTIVE");
    SheetsRepository.updateBy("Variants", "Variant_ID", variantId, { Lifecycle_Status: "ACTIVE" });
    audit_(actor, "REACTIVATE", "VARIANT", variantId, "Variant reactivated");
    return { ok: true };
  }

  return { create: create, updateCompany: updateCompany, archive: archive, reactivate: reactivate };
})();


// ===== domain/AttributeService.js =====

/** Typed attributes and variant overrides.
 * VALUE vs INTENTIONALLY_EMPTY are distinct. Removing override restores inheritance.
 */
var AttributeService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }
  function audit_(actor, action, entityType, entityId, reason) {
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityId + "|" + now_()),
      Event_Idempotency_Key: textSafe_(action + "|" + entityId),
      Payload_SHA256: sha_(entityId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: reason || ""
    });
  }
  function textSafe_(s) { return String(s || "").slice(0, 180); }

  function setProductValue(productId, attributeId, valueJson, actor) {
    require_(productId && attributeId && valueJson, "ATTRIBUTE_ARGUMENTS_INVALID");
    var existing = (SheetsRepository.listAll("Product_Attributes") || []).find(function (a) {
      return a.Product_ID === productId && a.Attribute_ID === attributeId;
    });
    if (existing) {
      SheetsRepository.updateBy("Product_Attributes", "Product_Attribute_ID", existing.Product_Attribute_ID, {
        Value_JSON: valueJson, Updated_At: now_(), Updated_By: actor
      });
    } else {
      SheetsRepository.append("Product_Attributes", {
        Product_Attribute_ID: stableId_("pattr", productId + "|" + attributeId),
        Product_ID: productId, Attribute_ID: attributeId, Value_JSON: valueJson,
        Updated_At: now_(), Updated_By: actor
      });
    }
    audit_(actor, "SET_PRODUCT_ATTRIBUTE", "PRODUCT_ATTRIBUTE", productId + "|" + attributeId, "Product attribute set");
    return { ok: true };
  }

  function setVariantOverride(variantId, attributeId, mode, valueJson, actor) {
    require_(["VALUE", "INTENTIONALLY_EMPTY"].indexOf(mode) >= 0, "INVALID_OVERRIDE_MODE");
    if (mode === "INTENTIONALLY_EMPTY") {
      require_(!valueJson || String(valueJson).trim() === "", "INTENTIONALLY_EMPTY_MUST_BE_BLANK");
    } else {
      require_(valueJson, "VALUE_REQUIRED_FOR_VALUE_MODE");
    }
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) {
      return o.Variant_ID === variantId && o.Attribute_ID === attributeId;
    });
    var record = {
      Override_Mode: mode,
      Value_JSON: mode === "VALUE" ? valueJson : "",
      Updated_At: now_(),
      Updated_By: actor
    };
    if (existing) {
      SheetsRepository.updateBy("Variant_Attribute_Overrides", "Variant_Override_ID", existing.Variant_Override_ID, record);
    } else {
      SheetsRepository.append("Variant_Attribute_Overrides", Object.assign({
        Variant_Override_ID: stableId_("vover", variantId + "|" + attributeId),
        Variant_ID: variantId, Attribute_ID: attributeId
      }, record));
    }
    audit_(actor, "SET_VARIANT_OVERRIDE", "VARIANT_ATTRIBUTE_OVERRIDE", variantId + "|" + attributeId, mode);
    return { ok: true };
  }

  function clearVariantOverride(variantId, attributeId, actor) {
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) {
      return o.Variant_ID === variantId && o.Attribute_ID === attributeId;
    });
    if (!existing) return { ok: true, skipped: true };
    var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID"))
      .getSheetByName("Variant_Attribute_Overrides");
    var row = SheetsRepository.findBy("Variant_Attribute_Overrides", "Variant_Override_ID", existing.Variant_Override_ID);
    if (row) sheet.deleteRow(row);
    audit_(actor, "CLEAR_OVERRIDE", "VARIANT_ATTRIBUTE_OVERRIDE", existing.Variant_Override_ID, "Override removed; inheritance restored");
    return { ok: true };
  }

  return { setProductValue: setProductValue, setVariantOverride: setVariantOverride, clearVariantOverride: clearVariantOverride };
})();


// ===== domain/SpecificationService.js =====

/** Specification change lifecycle.
 * Approval acquires LockService, re-reads state, validates transition, allocates Sequence_No.
 */
var SpecificationService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }
  function require_(c, code) { if (!c) throw new Error(code); }

  function currentStateForKey_(logicalKey) {
    var approved = (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) { return c.Logical_Specification_Key === logicalKey && c.Change_Status === "APPROVED"; })
      .sort(function (a, b) { return Number(a.Sequence_No) - Number(b.Sequence_No); });
    var state = logicalKey.indexOf("SRC:") === 0 ? "ACTIVE" : "ABSENT";
    approved.forEach(function (c) {
      if (c.Operation === "ADD" && state === "ABSENT") state = "ACTIVE";
      else if (c.Operation === "UPDATE" && state === "ACTIVE") state = "ACTIVE";
      else if (c.Operation === "DELETE" && state === "ACTIVE") state = "DELETED";
      else state = "QUARANTINED";
    });
    return state;
  }

  function appendDraft(options) {
    require_(options && options.actor && options.operation, "SPEC_CHANGE_INVALID");
    require_(["ADD", "UPDATE", "DELETE"].indexOf(options.operation) >= 0, "INVALID_OPERATION");
    var changeId = stableId_("schg", options.idempotencyKey || Utilities.getUuid());
    var existing = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
    if (existing) {
      // Idempotent only if payload matches; otherwise reject
      if (existing.Operation !== options.operation || existing.Product_ID !== options.productId) {
        throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");
      }
      return { changeId: changeId, reused: true };
    }
    var logical = options.targetSpecificationId ? ("SRC:" + options.targetSpecificationId) : ("ADD:" + changeId);
    SheetsRepository.append("Specification_Changes", {
      Specification_Change_ID: changeId,
      Logical_Specification_Key: logical,
      Sequence_No: "",
      Operation: options.operation,
      Target_Specification_ID: options.targetSpecificationId || "",
      Product_ID: options.productId,
      Variant_ID: options.variantId || "",
      Attribute_Key: text_(options.attributeKey, 160),
      Value_JSON: options.operation === "DELETE" ? "" : (options.valueJson || ""),
      Unit_Code: text_(options.unitCode, 40),
      Change_Status: "DRAFT",
      Reason: text_(options.reason, 1000),
      Created_At: now_(),
      Created_By: options.actor
    });
    return { changeId: changeId, reused: false };
  }

  function approve(changeId, actor) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw new Error("LOCK_TIMEOUT");
    try {
      var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
      require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
      var state = currentStateForKey_(change.Logical_Specification_Key);
      var op = change.Operation;
      if (state === "QUARANTINED") throw new Error("LOGICAL_KEY_QUARANTINED");
      if (op === "ADD" && state !== "ABSENT") throw new Error("INVALID_TRANSITION");
      if ((op === "UPDATE" || op === "DELETE") && state !== "ACTIVE") throw new Error("INVALID_TRANSITION");
      if (op !== "DELETE" && !change.Value_JSON) throw new Error("VALUE_REQUIRED");

      var existing = (SheetsRepository.listAll("Specification_Changes") || [])
        .filter(function (c) { return c.Logical_Specification_Key === change.Logical_Specification_Key && c.Change_Status === "APPROVED"; });
      var maxSeq = existing.reduce(function (m, c) { return Math.max(m, Number(c.Sequence_No) || 0); }, 0);
      var nextSeq = maxSeq + 1;
      var payloadHash = sha_(JSON.stringify({
        id: change.Specification_Change_ID,
        op: change.Operation,
        key: change.Logical_Specification_Key,
        value: change.Value_JSON
      }));
      SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, {
        Change_Status: "APPROVED",
        Sequence_No: nextSeq,
        Approved_At: now_(),
        Approved_By: actor,
        Approval_Payload_SHA256: payloadHash
      });
      SheetsRepository.append("Audit_Log", {
        Audit_ID: stableId_("aud", "APPROVE|" + changeId + "|" + nextSeq),
        Event_Idempotency_Key: "APPROVE|" + changeId,
        Payload_SHA256: payloadHash,
        Event_At: now_(),
        Actor_ID: actor,
        Action: "APPROVE",
        Entity_Type: "SPECIFICATION_CHANGE",
        Entity_ID: changeId,
        Reason: "Change approved with sequence " + nextSeq
      });
      return { ok: true, sequence: nextSeq, logicalKey: change.Logical_Specification_Key };
    } finally {
      lock.releaseLock();
    }
  }

  function reject(changeId, actor) {
    var change = SheetsRepository.getBy("Specification_Changes", "Specification_Change_ID", changeId);
    require_(change && change.Change_Status === "DRAFT", "CHANGE_NOT_DRAFT");
    SheetsRepository.updateBy("Specification_Changes", "Specification_Change_ID", changeId, { Change_Status: "REJECTED" });
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", "REJECT|" + changeId),
      Event_Idempotency_Key: "REJECT|" + changeId,
      Payload_SHA256: sha_(changeId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: "REJECT",
      Entity_Type: "SPECIFICATION_CHANGE",
      Entity_ID: changeId,
      Reason: "Change rejected"
    });
    return { ok: true };
  }

  return { appendDraft: appendDraft, approve: approve, reject: reject };
})();


// ===== domain/EffectiveSpecificationResolver.js =====

/** Deterministic effective specification resolver.
 * Reads immutable Specifications + APPROVED Specification_Changes only.
 * Never writes. Surfaces product/variant scope conflicts (ADR-040).
 * Includes company-created ADD records in conflict detection.
 * Sequence_No must be a finite positive integer; invalid sequences quarantine the key.
 */
var EffectiveSpecificationResolver = (function () {
  function isValidSequence_(seq) {
    return typeof seq === "number" && Number.isFinite(seq) && Number.isInteger(seq) && seq > 0;
  }

  function getChangesForKey_(logicalKey) {
    return (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) { return c.Logical_Specification_Key === logicalKey && c.Change_Status === "APPROVED"; })
      .sort(function (a, b) { return Number(a.Sequence_No) - Number(b.Sequence_No); });
  }

  function reduce_(logicalKey, initialState, initialValue) {
    var changes = getChangesForKey_(logicalKey);
    var state = initialState;
    var value = initialValue;
    var history = [];
    var quarantined = false;
    var seenSeq = {};

    changes.forEach(function (c) {
      var raw = c.Sequence_No;
      var seq = Number(raw);
      if (!isValidSequence_(seq) || seenSeq[seq]) {
        quarantined = true;
        return;
      }
      seenSeq[seq] = true;
      var op = c.Operation;
      if (op === "ADD" && state === "ABSENT") {
        state = "ACTIVE"; value = c.Value_JSON; history.push(c);
      } else if (op === "UPDATE" && state === "ACTIVE") {
        value = c.Value_JSON; history.push(c);
      } else if (op === "DELETE" && state === "ACTIVE") {
        state = "DELETED"; value = null; history.push(c);
      } else {
        quarantined = true;
      }
    });

    return {
      state: quarantined ? "QUARANTINED" : state,
      value: quarantined ? null : value,
      history: history,
      quarantined: quarantined
    };
  }

  function normKey_(key) {
    return String(key || "").trim().toLowerCase();
  }

  function resolveEffectiveSpecifications(productId, variantId) {
    var validationErrors = [];
    if (variantId) {
      var variant = SheetsRepository.getBy("Variants", "Variant_ID", variantId);
      if (!variant) validationErrors.push({ code: "VARIANT_NOT_FOUND", variantId: variantId });
      else if (variant.Product_ID !== productId) validationErrors.push({ code: "VARIANT_PRODUCT_MISMATCH", productId: productId, variantId: variantId });
    }
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (!product) validationErrors.push({ code: "PRODUCT_NOT_FOUND", productId: productId });

    var sourceSpecs = (SheetsRepository.listAll("Specifications") || []).filter(function (s) {
      return s.Product_ID === productId && (!variantId || !s.Variant_ID || s.Variant_ID === variantId || s.Scope === "PRODUCT");
    });

    var sourceResults = [];
    var byNorm = {};

    sourceSpecs.forEach(function (spec) {
      var logical = "SRC:" + spec.Specification_ID;
      var reduced = reduce_(logical, "ACTIVE", spec.Attribute_Value_Source);
      var nk = normKey_(spec.Normalized_Key || spec.Attribute_Key_Source);
      var item = {
        specification_id: spec.Specification_ID,
        logical_key: logical,
        scope: spec.Scope,
        attribute_key: spec.Attribute_Key_Source,
        normalized_key: nk,
        original_source_value: spec.Attribute_Value_Source,
        effective_value: reduced.value,
        unit: spec.Unit_Source || "",
        provenance: reduced.quarantined ? "QUARANTINED" : (reduced.history.length ? "SOURCE_MODIFIED" : "SOURCE"),
        state: reduced.state,
        quarantined: reduced.quarantined,
        history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
      };
      if (item.state !== "DELETED" && !item.quarantined) sourceResults.push(item);
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
      if (reduced.quarantined) validationErrors.push({ code: "LOGICAL_KEY_QUARANTINED", key: logical });
    });

    var companyCreated = (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) {
        return c.Product_ID === productId &&
               (!variantId || !c.Variant_ID || c.Variant_ID === variantId) &&
               String(c.Logical_Specification_Key || "").indexOf("ADD:") === 0 &&
               c.Change_Status === "APPROVED";
      });
    var seenAdd = {};
    companyCreated.forEach(function (c) {
      var key = c.Logical_Specification_Key;
      if (seenAdd[key]) return;
      seenAdd[key] = true;
      var reduced = reduce_(key, "ABSENT", null);
      var nk = normKey_(c.Attribute_Key);
      var item = {
        specification_id: null,
        logical_key: key,
        scope: c.Variant_ID ? "VARIANT" : "PRODUCT",
        attribute_key: c.Attribute_Key,
        normalized_key: nk,
        effective_value: reduced.value,
        unit: c.Unit_Code || "",
        provenance: "COMPANY_ADDED",
        state: reduced.state,
        quarantined: reduced.quarantined,
        history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
      };
      if (item.state === "ACTIVE" && !item.quarantined) sourceResults.push(item);
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
      if (reduced.quarantined) validationErrors.push({ code: "LOGICAL_KEY_QUARANTINED", key: key });
    });

    var conflicts = [];
    Object.keys(byNorm).forEach(function (nk) {
      var items = byNorm[nk].filter(function (i) { return !i.quarantined && i.state !== "DELETED"; });
      var productItems = items.filter(function (i) { return i.scope === "PRODUCT"; });
      var variantItems = items.filter(function (i) { return i.scope === "VARIANT"; });
      if (productItems.length && variantItems.length) {
        conflicts.push({
          normalized_key: nk,
          product: productItems,
          variant: variantItems,
          note: "ADR-040: both product-scope and variant-scope assertions preserved; no automatic precedence"
        });
      }
    });

    var productAttrs = (SheetsRepository.listAll("Product_Attributes") || []).filter(function (a) { return a.Product_ID === productId; });
    var variantOverrides = variantId
      ? (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).filter(function (o) { return o.Variant_ID === variantId; })
      : [];
    var attrMap = {};
    productAttrs.forEach(function (pa) {
      attrMap[pa.Attribute_ID] = { attribute_id: pa.Attribute_ID, product_value: pa.Value_JSON, effective_value: pa.Value_JSON, mode: "INHERITED", override_mode: null };
    });
    variantOverrides.forEach(function (ov) {
      if (!attrMap[ov.Attribute_ID]) {
        attrMap[ov.Attribute_ID] = { attribute_id: ov.Attribute_ID, product_value: null, effective_value: null, mode: "NO_BASE", override_mode: ov.Override_Mode };
      }
      var entry = attrMap[ov.Attribute_ID];
      entry.override_mode = ov.Override_Mode;
      if (ov.Override_Mode === "VALUE") {
        entry.effective_value = ov.Value_JSON;
        entry.mode = "CUSTOMIZED";
      } else if (ov.Override_Mode === "INTENTIONALLY_EMPTY") {
        entry.effective_value = null;
        entry.mode = "EMPTY";
      }
    });
    var companyAttributes = Object.keys(attrMap).map(function (k) { return attrMap[k]; });

    return {
      source_specifications: sourceResults,
      company_attributes: companyAttributes,
      conflicts: conflicts,
      provenance: { product_id: productId, variant_id: variantId || null, resolved_at: new Date().toISOString() },
      validation_errors: validationErrors
    };
  }

  return { resolveEffectiveSpecifications: resolveEffectiveSpecifications };
})();


// ===== domain/CatalogService.js =====

var CatalogService = (function () {
  function id_(prefix) {
    return prefix + "_" + Utilities.getUuid().replace(/-/g, "");
  }
  function sha256_(bytes) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    return digest.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    }).join("");
  }
  function resultFor_(catalog, run) {
    return {
      catalogId: catalog.Catalog_ID,
      runId: run.Run_ID,
      sha256: catalog.SHA256,
      fileName: catalog.Source_File_Name,
      status: run.Run_Status,
      idempotentReplay: true
    };
  }
  function sameRegistration_(catalog, payload, file, mime) {
    var expected = {
      Supplier_Name: String(payload.supplierName).trim(),
      Catalog_Title: payload.catalogTitle || "",
      Catalog_Reference: payload.catalogReference || "",
      Catalog_Revision: payload.catalogRevision || "",
      Language_Code: payload.languageCode || "",
      Published_Date: payload.publishedDate || "",
      Source_URL: payload.sourceUrl || "",
      Notes: payload.notes || "",
      Source_File_ID: file.getId(),
      Source_File_Name: file.getName(),
      MIME_Type: mime,
      File_Size_Bytes: file.getSize()
    };
    var mismatches = Object.keys(expected).filter(function (key) {
      return String(catalog[key] === undefined || catalog[key] === null ? "" : catalog[key]) !== String(expected[key]);
    });
    return mismatches.length ? mismatches[0] : "";
  }
  function createRun_(catalogId, sourceHash, now) {
    var runId = id_("run");
    var logicalJobId = id_("job");
    SheetsRepository.append("Run_Log", {
      Run_ID: runId, Run_Type: "CATALOG_EXTRACTION", Catalog_ID: catalogId,
      Logical_Job_ID: logicalJobId, Parent_Run_ID: "", Attempt_Number: 1,
      Retry_Reason: "", Idempotency_Key: "catalog_sha256_" + sourceHash, Run_Status: "QUEUED",
      Current_Step: "REGISTERED", Total_Units: "", Completed_Units: 0, Failed_Units: 0,
      Created_At: now, Created_By: APP.ACTOR_ID
    });
    return SheetsRepository.getBy("Run_Log", "Run_ID", runId);
  }
  function register(payload) {
    var required = ["driveFileId", "supplierName"];
    required.forEach(function (key) {
      if (!payload[key] || !String(payload[key]).trim()) throw new Error("VALIDATION_REQUIRED: " + key);
    });
    var props = PropertiesService.getScriptProperties();
    var folderId = props.getProperty("DEV_CATALOG_FOLDER_ID");
    if (!folderId) throw new Error("CONFIG_MISSING: DEV_CATALOG_FOLDER_ID");

    var file = DriveApp.getFileById(String(payload.driveFileId));
    var parents = file.getParents(), allowed = false;
    while (parents.hasNext()) if (parents.next().getId() === folderId) allowed = true;
    if (!allowed) throw new Error("FILE_OUTSIDE_DEV_INTAKE_FOLDER");
    var mime = file.getMimeType();
    if (mime !== "application/pdf") throw new Error("UNSUPPORTED_MIME_TYPE");
    var hash = sha256_(file.getBlob().getBytes());

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var existingCatalog = SheetsRepository.getBy("Catalogs", "SHA256", hash);
      if (existingCatalog) {
        var mismatchField = sameRegistration_(existingCatalog, payload, file, mime);
        if (mismatchField) {
          throw new Error("DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW: " + mismatchField);
        }
        var existingRun = SheetsRepository.getBy("Run_Log", "Catalog_ID", existingCatalog.Catalog_ID);
        // A crash after the Catalogs append but before Run_Log append is repaired on retry.
        if (!existingRun) existingRun = createRun_(existingCatalog.Catalog_ID, hash, new Date().toISOString());
        return resultFor_(existingCatalog, existingRun);
      }

      var now = new Date().toISOString();
      var catalogId = id_("cat");
      SheetsRepository.append("Catalogs", {
        Catalog_ID: catalogId, Supplier_Name: String(payload.supplierName).trim(),
        Catalog_Title: payload.catalogTitle || "", Catalog_Reference: payload.catalogReference || "",
        Catalog_Revision: payload.catalogRevision || "", Language_Code: payload.languageCode || "",
        Source_File_ID: file.getId(), Source_File_Name: file.getName(), MIME_Type: mime,
        File_Size_Bytes: file.getSize(), SHA256: hash, Published_Date: payload.publishedDate || "",
        Received_At: now, Source_URL: payload.sourceUrl || "", Notes: payload.notes || "",
        Lifecycle_Status: "ACTIVE", Created_At: now, Created_By: APP.ACTOR_ID
      });
      // If this second append fails, a retry finds the catalog by SHA256 and repairs Run_Log.
      var run = createRun_(catalogId, hash, now);
      return {
        catalogId: catalogId, runId: run.Run_ID, sha256: hash,
        fileName: file.getName(), status: run.Run_Status, idempotentReplay: false
      };
    } finally {
      lock.releaseLock();
    }
  }
  return { register: register };
})();


// ===== domain/Ingest.js =====

/** Validates and idempotently materializes a Worker result manifest into V2.1 Sheets. */
var Ingest = (function () {
  function canonical_(value) {
    if (typeof value === "string") return value.normalize ? value.normalize("NFC") : value;
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        var normalizedKey = key.normalize ? key.normalize("NFC") : key;
        if (Object.prototype.hasOwnProperty.call(out, normalizedKey)) throw new Error("MANIFEST_CANONICAL_KEY_COLLISION");
        out[normalizedKey] = canonical_(value[key]);
      });
      return out;
    }
    return value;
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function sha256Bytes_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function sha256Text_(value) { return sha256Bytes_(Utilities.newBlob(value, "application/json").getBytes()); }
  function requireString_(obj, key) {
    if (!obj || typeof obj[key] !== "string" || !obj[key].trim()) throw new Error("MANIFEST_FIELD_INVALID: " + key);
    return obj[key].trim();
  }
  function verifyManifest_(manifest, run, expectedRawSha) {
    if (!manifest || Object.prototype.toString.call(manifest) !== "[object Object]") throw new Error("MANIFEST_INVALID");
    if (manifest.protocol_version !== "1" || manifest.manifest_version !== 2) throw new Error("MANIFEST_VERSION_UNSUPPORTED");
    if (requireString_(manifest, "run_id") !== run.Run_ID) throw new Error("MANIFEST_RUN_MISMATCH");
    if (requireString_(manifest, "catalog_id") !== run.Catalog_ID) throw new Error("MANIFEST_CATALOG_MISMATCH");
    if (requireString_(manifest, "logical_job_id") !== run.Logical_Job_ID) throw new Error("MANIFEST_LOGICAL_JOB_MISMATCH");
    if (manifest.attempt_number !== Number(run.Attempt_Number) || manifest.run_type !== "CATALOG_EXTRACTION" ||
        String(manifest.parent_run_id || "") !== String(run.Parent_Run_ID || "") ||
        String(manifest.retry_reason || "") !== String(run.Retry_Reason || "")) {
      throw new Error("MANIFEST_RUN_LINEAGE_MISMATCH");
    }
    var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", run.Catalog_ID);
    if (!catalog || manifest.source_sha256 !== catalog.SHA256) throw new Error("MANIFEST_SOURCE_MISMATCH");
    if (expectedRawSha && expectedRawSha !== sha256Text_(canonicalJson_(manifest))) {
      throw new Error("MANIFEST_FILE_SHA256_MISMATCH");
    }
    var copy = {};
    Object.keys(manifest).forEach(function (key) { if (key !== "manifest_sha256") copy[key] = manifest[key]; });
    if (manifest.manifest_sha256 !== sha256Text_(canonicalJson_(copy))) throw new Error("MANIFEST_SHA256_INVALID");
    if (!Number.isInteger(manifest.page_count) || manifest.page_count < 0) throw new Error("MANIFEST_PAGE_COUNT_INVALID");
    if (!Array.isArray(manifest.pages)) throw new Error("MANIFEST_PAGES_INVALID");
    ["completed_units", "failed_units", "reused_units", "newly_processed_units"].forEach(function (key) {
      if (!Number.isInteger(manifest[key]) || manifest[key] < 0) throw new Error("MANIFEST_COUNTER_INVALID: " + key);
    });
    if (manifest.run_status === "COMPLETED") {
      if (manifest.reused_units > manifest.completed_units ||
          manifest.newly_processed_units + manifest.reused_units !== manifest.completed_units) {
        throw new Error("MANIFEST_COUNTERS_INCONSISTENT");
      }
      if (manifest.page_count < 1 || manifest.pages.length !== manifest.page_count ||
          manifest.completed_units !== manifest.page_count || manifest.failed_units !== 0) {
        throw new Error("MANIFEST_UNIT_COUNTS_INVALID");
      }
    } else if (manifest.run_status !== "FAILED") {
      throw new Error("MANIFEST_STATUS_NOT_TERMINAL");
    }
    var seen = {};
    manifest.pages.forEach(function (page, index) {
      if (!page || page.page_number !== index + 1) throw new Error("MANIFEST_PAGE_ORDER_INVALID");
      var key = requireString_(page, "unit_key");
      if (page.unit_type !== "CATALOG_PAGE" || key !== page.catalog_page_id ||
          page.catalog_page_id !== "cp_" + manifest.catalog_id + "_" + String(index + 1).padStart(5, "0")) {
        throw new Error("MANIFEST_PAGE_IDENTITY_INVALID");
      }
      if (seen[key] || seen[page.run_unit_id]) throw new Error("MANIFEST_DUPLICATE_UNIT_KEY");
      seen[key] = true; seen[page.run_unit_id] = true;
      requireString_(page, "run_unit_id");
      requireString_(page, "catalog_page_id");
      requireString_(page, "input_sha256");
      if (!/^[a-f0-9]{64}$/.test(page.input_sha256)) throw new Error("MANIFEST_INPUT_SHA_INVALID");
      if (manifest.run_status === "COMPLETED") {
        if (page.unit_status !== "COMPLETED" && page.unit_status !== "REUSED") throw new Error("MANIFEST_UNIT_STATUS_INVALID");
        requireString_(page, "artifact_file_id");
        requireString_(page, "artifact_file_sha256");
        requireString_(page, "output_sha256");
        if (!/^[a-f0-9]{64}$/.test(page.artifact_file_sha256) || !/^[a-f0-9]{64}$/.test(page.output_sha256)) {
          throw new Error("MANIFEST_OUTPUT_SHA_INVALID");
        }
      }
    });
  }
  function verifyArtifact_(page, manifest) {
    var file = DriveApp.getFileById(page.artifact_file_id);
    var bytes = file.getBlob().getBytes();
    if (sha256Bytes_(bytes) !== page.artifact_file_sha256) throw new Error("PAGE_ARTIFACT_FILE_SHA256_MISMATCH");
    var artifact;
    try { artifact = JSON.parse(file.getBlob().getDataAsString("UTF-8")); }
    catch (err) { throw new Error("PAGE_ARTIFACT_JSON_INVALID"); }
    var artifactCopy = {};
    Object.keys(artifact).forEach(function (key) { if (key !== "output_sha256") artifactCopy[key] = artifact[key]; });
    if (artifact.output_sha256 !== sha256Text_(canonicalJson_(artifactCopy))) throw new Error("PAGE_ARTIFACT_CHECKSUM_INVALID");
    if (artifact.source_pdf_sha256 !== manifest.source_sha256 || artifact.page_number !== page.page_number ||
        artifact.run_id !== manifest.run_id || artifact.catalog_id !== manifest.catalog_id ||
        artifact.run_unit_id !== page.run_unit_id || artifact.catalog_page_id !== page.catalog_page_id ||
        artifact.unit_key !== page.unit_key || artifact.input_sha256 !== page.input_sha256 ||
        artifact.output_sha256 !== page.output_sha256 || artifact.unit_status !== page.unit_status) {
      throw new Error("PAGE_ARTIFACT_IDENTITY_MISMATCH");
    }
  }
  function ensureCatalogPage_(catalogId, page, now) {
    var existing = SheetsRepository.getBy("Catalog_Pages", "Catalog_Page_ID", page.catalog_page_id);
    if (existing) {
      if (existing.Catalog_ID !== catalogId || Number(existing.Page_Number) !== page.page_number) {
        throw new Error("CATALOG_PAGE_ID_CONFLICT");
      }
      return;
    }
    SheetsRepository.append("Catalog_Pages", {
      Catalog_Page_ID: page.catalog_page_id, Catalog_ID: catalogId,
      Page_Number: page.page_number, Page_Label: String(page.page_number), Created_At: now
    });
  }
  function ensureRunUnit_(runId, page, manifest, now) {
    var existing = SheetsRepository.getBy("Run_Units", "Run_Unit_ID", page.run_unit_id);
    var record = {
      Run_Unit_ID: page.run_unit_id, Run_ID: runId, Unit_Type: "CATALOG_PAGE",
      Unit_Key: page.unit_key, Catalog_Page_ID: page.catalog_page_id,
      Unit_Status: page.unit_status, Input_SHA256: page.input_sha256,
      Output_Manifest_File_ID: page.artifact_file_id || "",
      Output_SHA256: page.output_sha256 || "",
      Reused_From_Run_Unit_ID: page.reused_from_run_unit_id || "",
      Attempt_Started_At: manifest.started_at ? new Date(manifest.started_at).toISOString() : now,
      Attempt_Finished_At: manifest.finished_at ? new Date(manifest.finished_at).toISOString() : now,
      Error_Code: "", Created_At: now
    };
    if (existing) {
      ["Run_ID", "Unit_Type", "Unit_Key", "Catalog_Page_ID", "Input_SHA256"].forEach(function (key) {
        if (String(existing[key]) !== String(record[key])) throw new Error("RUN_UNIT_ID_CONFLICT: " + key);
      });
      if (existing.Unit_Status !== record.Unit_Status || existing.Output_SHA256 !== record.Output_SHA256 ||
          existing.Output_Manifest_File_ID !== record.Output_Manifest_File_ID) {
        throw new Error("RUN_UNIT_REPLAY_CONFLICT");
      }
      return;
    }
    SheetsRepository.append("Run_Units", record);
  }
  function ingestManifest(options) {
    var runId = options.runId, manifestFileId = options.resultManifestFileId;
    if (!runId || !manifestFileId) throw new Error("INGEST_ARGUMENTS_INVALID");
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      if (!run) throw new Error("RUN_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        if (run.Output_Manifest_File_ID === manifestFileId) return { run_id: runId, run_status: run.Run_Status, skipped: true };
        throw new Error("TERMINAL_RUN_RESULT_CONFLICT");
      }
      var manifestFile = DriveApp.getFileById(manifestFileId);
      var manifestText = manifestFile.getBlob().getDataAsString("UTF-8");
      var manifest;
      try { manifest = JSON.parse(manifestText); } catch (err) { throw new Error("MANIFEST_JSON_INVALID"); }
      var rawSha = sha256Bytes_(manifestFile.getBlob().getBytes());
      if (options.resultManifestSha256 && options.resultManifestSha256 !== rawSha) throw new Error("MANIFEST_FILE_SHA256_MISMATCH");
      verifyManifest_(manifest, run, rawSha);
      var now = new Date().toISOString();
      if (manifest.run_status === "FAILED") {
        SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
          Run_Status: "FAILED", Current_Step: "WORKER_FAILED",
          Total_Units: manifest.page_count, Completed_Units: 0,
          Failed_Units: Math.max(1, Number(manifest.failed_units) || manifest.page_count || 1),
          Worker_Version: options.workerVersion || manifest.worker_version || "",
          Output_Manifest_File_ID: manifestFileId, Finished_At: now,
          Worker_Lease_ID: "", Lease_Expires_At: "",
          Error_Code: manifest.error_code || "WORKER_FAILED",
          Error_Summary: manifest.error_message || "Worker failed before completing page extraction."
        });
        return { run_id: runId, run_status: "FAILED", completed_units: 0, failed_units: manifest.failed_units || manifest.page_count };
      }
      manifest.pages.forEach(function (page) {
        verifyArtifact_(page, manifest);
        ensureCatalogPage_(run.Catalog_ID, page, now);
        ensureRunUnit_(runId, page, manifest, now);
      });
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "COMPLETED", Current_Step: "INGESTED",
        Total_Units: manifest.page_count, Completed_Units: manifest.completed_units,
        Failed_Units: manifest.failed_units, Worker_Version: options.workerVersion || manifest.worker_version || "",
        Output_Manifest_File_ID: manifestFileId, Worker_Lease_ID: "", Lease_Expires_At: "",
        Started_At: manifest.started_at ? new Date(manifest.started_at).toISOString() : now,
        Finished_At: manifest.finished_at ? new Date(manifest.finished_at).toISOString() : now,
        Error_Code: "", Error_Summary: ""
      });
      return { run_id: runId, run_status: "COMPLETED", completed_units: manifest.completed_units,
        failed_units: manifest.failed_units, reused_units: manifest.reused_units || 0 };
    } finally {
      lock.releaseLock();
    }
  }
  return { ingestManifest: ingestManifest };
})();


// ===== domain/CandidateReviewIntake.js =====
/** Conservative intake of worker product candidates into human review.
 *
 * Product candidates are staged as NEEDS_REVIEW. Model/spec candidates remain
 * attached to their immutable page artifact until a human establishes parent
 * relationships; this module never guesses product/model ownership or promotes
 * records into canonical tables.
 */
var CandidateReviewIntake = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function now_() { return new Date().toISOString(); }
  function canonical_(value) {
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "string") return value.normalize ? value.normalize("NFC") : value;
    if (typeof value === "number") { if (!isFinite(value)) fail_("CANDIDATE_NONFINITE_NUMBER"); return value; }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      Object.keys(value).forEach(function (key) {
        var normalizedKey = key.normalize ? key.normalize("NFC") : key;
        if (Object.prototype.hasOwnProperty.call(out, normalizedKey)) fail_("CANDIDATE_CANONICAL_KEY_COLLISION");
        out[normalizedKey] = canonical_(value[key]);
      });
      return out;
    }
    fail_("CANDIDATE_VALUE_UNSUPPORTED");
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function sha_(value) {
    var bytes = typeof value === "string" ? Utilities.newBlob(value, "application/json").getBytes() : value;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 24); }
  function text_(value, limit) {
    var result = typeof value === "string" ? value.trim() : "";
    if (result.normalize) result = result.normalize("NFC");
    return result.length > limit ? result.slice(0, limit) : result;
  }
  function confidence_(value) {
    var map = { HIGH: 0.95, MEDIUM: 0.7, LOW: 0.4 };
    return Object.prototype.hasOwnProperty.call(map, String(value || "").toUpperCase())
      ? map[String(value).toUpperCase()] : "";
  }
  function ensure_(table, idColumn, record, compareFields, conflictCode) {
    var existing = SheetsRepository.getBy(table, idColumn, record[idColumn]);
    if (existing) {
      compareFields.forEach(function (field) {
        var a = existing[field], b = record[field];
        if (String(a === undefined || a === null ? "" : a) !== String(b === undefined || b === null ? "" : b)) {
          fail_(conflictCode);
        }
      });
      return false;
    }
    SheetsRepository.append(table, record);
    return true;
  }
  function createProduct_(candidate, page, artifact, manifest, actor, index, counts) {
    var name = text_(candidate.proposed_product_name, 300);
    require_(name, "CANDIDATE_PRODUCT_NAME_MISSING");
    var quote = text_(candidate.source_quote, 4000);
    var sourceSeed = manifest.run_id + "|" + page.catalog_page_id + "|" + index + "|" + name + "|" + quote;
    var sourceKey = "candidate-v1|" + sha_(sourceSeed).slice(0, 48);
    var stagingId = stableId_("stgprd", sourceKey);
    var createdAt = now_();
    var method = String(artifact.extraction_method || "").toUpperCase();
    require_(["EMBEDDED_TEXT", "OCR", "TABLE_PARSER", "MANUAL"].indexOf(method) >= 0, "CANDIDATE_EXTRACTION_METHOD_INVALID");
    var stablePayload = {
      Staging_ID: stagingId, Run_ID: manifest.run_id, Catalog_ID: manifest.catalog_id,
      Catalog_Page_ID: page.catalog_page_id, Raw_Extract_File_ID: page.artifact_file_id,
      Extracted_Text: quote, Extraction_Method: method,
      Extraction_Tool_Version: text_(artifact.extraction_tool_version, 120),
      Source_Key_Algorithm_Version: "candidate-intake-v1",
      Confidence: confidence_(candidate.confidence), Proposed_Status: "NEEDS_REVIEW",
      Proposed_Product_Name_EN: name, Identity_Match_Method: "UNRESOLVED",
      Source_Record_Key: sourceKey
    };
    var record = Object.assign({}, stablePayload, {
      Staging_Record_Hash: sha_(canonicalJson_(stablePayload)),
      Created_At: createdAt, Updated_At: createdAt
    });
    if (ensure_("Staging_Products", "Staging_ID", record,
      ["Run_ID", "Catalog_ID", "Catalog_Page_ID", "Raw_Extract_File_ID", "Extracted_Text",
       "Extraction_Method", "Source_Key_Algorithm_Version", "Proposed_Product_Name_EN", "Source_Record_Key"],
      "STAGING_PRODUCT_CONFLICT")) counts.staging_products += 1;
    var reviewId = stableId_("revprd", stagingId);
    var review = {
      Review_Queue_ID: reviewId, Review_Type: "PRODUCT_MATCH", Priority: "NORMAL",
      Review_Status: "OPEN",
      Proposed_Action: "Verify this extracted product name against the source page before any promotion.",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Created_By"],
      "CANDIDATE_REVIEW_CONFLICT")) counts.review_items += 1;
    var link = {
      Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + stagingId),
      Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "PRIMARY",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", link,
      ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
      "CANDIDATE_REVIEW_LINK_CONFLICT")) counts.review_links += 1;
    return stagingId;
  }
  function createAmbiguityReview_(page, artifact, manifest, actor, productStagingIds, counts) {
    var candidates = artifact.product_candidates || {};
    var variants = Array.isArray(candidates.variants) ? candidates.variants : [];
    var specs = Array.isArray(candidates.specifications) ? candidates.specifications : [];
    if (!variants.length && !specs.length) return;
    var reviewId = stableId_("revamb", manifest.run_id + "|" + page.catalog_page_id);
    var createdAt = now_();
    var review = {
      Review_Queue_ID: reviewId, Review_Type: "EXTRACTION_AMBIGUITY", Priority: "NORMAL",
      Review_Status: "OPEN",
      Proposed_Action: "Resolve parent product/model for model and specification candidates on page " + page.catalog_page_id + " in run " + manifest.run_id + ". Inspect the page artifact referenced by Run_Units; no parent relationship was inferred.",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Created_By"],
      "CANDIDATE_AMBIGUITY_REVIEW_CONFLICT")) counts.review_items += 1;
    (productStagingIds || []).forEach(function (stagingId) {
      var link = {
        Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + stagingId + "|EVIDENCE"),
        Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "EVIDENCE",
        Created_At: createdAt, Created_By: actor
      };
      if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", link,
        ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
        "CANDIDATE_EVIDENCE_LINK_CONFLICT")) counts.review_links += 1;
    });
  }
  function intakeRun(options) {
    require_(options && typeof options.runId === "string" && typeof options.resultManifestFileId === "string",
      "CANDIDATE_INTAKE_ARGUMENTS_INVALID");
    var run = SheetsRepository.getBy("Run_Log", "Run_ID", options.runId);
    require_(run && run.Run_Status === "COMPLETED", "CANDIDATE_RUN_NOT_COMPLETED");
    require_(run.Output_Manifest_File_ID === options.resultManifestFileId, "CANDIDATE_MANIFEST_NOT_INGESTED");
    var manifestFile = DriveApp.getFileById(options.resultManifestFileId);
    var manifestBlob = manifestFile.getBlob();
    var manifest;
    try { manifest = JSON.parse(manifestBlob.getDataAsString("UTF-8")); } catch (e) { fail_("CANDIDATE_MANIFEST_INVALID_JSON"); }
    require_(manifest && manifest.run_id === run.Run_ID && manifest.catalog_id === run.Catalog_ID &&
      manifest.run_status === "COMPLETED" && Array.isArray(manifest.pages), "CANDIDATE_MANIFEST_IDENTITY_INVALID");
    var manifestCopy = {};
    Object.keys(manifest).forEach(function (key) { if (key !== "manifest_sha256") manifestCopy[key] = manifest[key]; });
    require_(typeof manifest.manifest_sha256 === "string" && SHA_RE.test(manifest.manifest_sha256) &&
      sha_(canonicalJson_(manifestCopy)) === manifest.manifest_sha256, "CANDIDATE_MANIFEST_CHECKSUM_INVALID");
    var actor = APP.ACTOR_ID;
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var counts = { pages: 0, staging_products: 0, review_items: 0, review_links: 0, variants_unassigned: 0, specifications_unassigned: 0 };
      manifest.pages.forEach(function (page) {
        var file = DriveApp.getFileById(page.artifact_file_id);
        var blob = file.getBlob(), bytes = blob.getBytes();
        require_(sha_(bytes) === page.artifact_file_sha256, "CANDIDATE_ARTIFACT_FILE_SHA_MISMATCH");
        var artifact;
        try { artifact = JSON.parse(blob.getDataAsString("UTF-8")); } catch (e) { fail_("CANDIDATE_ARTIFACT_INVALID_JSON"); }
        require_(artifact && artifact.run_id === manifest.run_id && artifact.catalog_id === manifest.catalog_id &&
          artifact.catalog_page_id === page.catalog_page_id && artifact.page_number === page.page_number &&
          artifact.output_sha256 === page.output_sha256, "CANDIDATE_ARTIFACT_IDENTITY_INVALID");
        var artifactCopy = {};
        Object.keys(artifact).forEach(function (key) { if (key !== "output_sha256") artifactCopy[key] = artifact[key]; });
        require_(sha_(canonicalJson_(artifactCopy)) === artifact.output_sha256, "CANDIDATE_ARTIFACT_CHECKSUM_INVALID");
        var candidateSet = artifact.product_candidates || {};
        var products = Array.isArray(candidateSet.products) ? candidateSet.products : [];
        var variants = Array.isArray(candidateSet.variants) ? candidateSet.variants : [];
        var specs = Array.isArray(candidateSet.specifications) ? candidateSet.specifications : [];
        var productStagingIds = [];
        products.forEach(function (candidate, index) {
          productStagingIds.push(createProduct_(candidate, page, artifact, manifest, actor, index, counts));
        });
        createAmbiguityReview_(page, artifact, manifest, actor, productStagingIds, counts);
        counts.pages += 1;
        counts.variants_unassigned += variants.length;
        counts.specifications_unassigned += specs.length;
      });
    } finally {
      lock.releaseLock();
    }
    // ImageReviewIntake acquires the same Apps Script lock internally. Call it
    // only after releasing this module's lock to avoid a nested-lock timeout.
    var imageIntake = null;
    var imageResult = manifest.image_extraction || {};
    if (imageResult.enabled === true && imageResult.status === "COMPLETED") {
      imageIntake = ImageReviewIntake.intake({
        imageManifestFileId: imageResult.manifest_file_id,
        imageManifestSha256: imageResult.manifest_sha256,
        driveManifestFileId: imageResult.drive_manifest_file_id,
        driveManifestSha256: imageResult.drive_manifest_sha256,
        actor: actor
      });
      require_(imageIntake && imageIntake.status === "COMPLETED", "IMAGE_REVIEW_INTAKE_INCOMPLETE");
    }
    return { status: "COMPLETED", run_id: manifest.run_id, catalog_id: manifest.catalog_id,
      counts: counts, image_intake: imageIntake,
      note: "Product candidates were staged for human review. Model/specification candidates remain in their verified page artifacts until a reviewer establishes parent relationships." };
  }
  return { intakeRun: intakeRun };
})();


// ===== domain/WorkerIntegration.js =====
/** GitHub Actions dispatch plus owner-executed Drive result polling. */
var WorkerIntegration = (function () {
  var CONTRACT_VERSION = "1";
  function property_(name) {
    return (PropertiesService.getScriptProperties().getProperty(name) || "").trim();
  }
  function sha256Text_(value) {
    var bytes = Utilities.newBlob(String(value), "text/plain").getBytes();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    return digest.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    }).join("");
  }
  function expectedIdempotencyKey_(run, catalog) {
    var attempt = Number(run.Attempt_Number) || 1;
    var parent = String(run.Parent_Run_ID || "").trim();
    var retry = String(run.Retry_Reason || "").trim();
    return sha256Text_([
      String(run.Logical_Job_ID).trim(), String(run.Run_ID).trim(), String(attempt),
      parent, retry, String(catalog.SHA256).trim().toLowerCase()
    ].join("|"));
  }
  function getRunFolder_(runId) {
    var rootId = property_("DEV_RUNS_FOLDER_ID");
    if (!rootId) throw new Error("CONFIG_MISSING: DEV_RUNS_FOLDER_ID");
    var root = DriveApp.getFolderById(rootId), folders = root.getFoldersByName(runId);
    if (folders.hasNext()) return folders.next();
    return root.createFolder(runId);
  }
  function immutableJobFile_(folder, body) {
    var content = JSON.stringify(body), files = folder.getFilesByName("job.json");
    if (files.hasNext()) {
      var existing = files.next();
      if (existing.getBlob().getDataAsString("UTF-8") !== content) throw new Error("JOB_MANIFEST_IMMUTABLE_CONFLICT");
      return existing;
    }
    return folder.createFile("job.json", content, MimeType.JSON);
  }
  function dispatchCatalogRun(catalogId, runId) {
    var token = property_("GITHUB_ACTIONS_TOKEN");
    if (!token) return { configured: false, accepted: false, reason: "GITHUB_ACTIONS_TOKEN_NOT_CONFIGURED" };
    var workflowRef = property_("GITHUB_WORKFLOW_REF") || "dev/worker-v2.1-resumable";
    if (!/^[A-Za-z0-9._\\/-]{1,120}$/.test(workflowRef) || workflowRef.indexOf("..") >= 0) {
      throw new Error("GITHUB_WORKFLOW_REF_INVALID");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", catalogId);
      if (!run || !catalog || run.Catalog_ID !== catalogId) throw new Error("RUN_CATALOG_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        throw new Error("TERMINAL_RUN_CANNOT_DISPATCH");
      }
      var idempotencyKey = expectedIdempotencyKey_(run, catalog);
      var storedKey = String(run.Idempotency_Key || "").trim().toLowerCase();
      if (storedKey !== idempotencyKey) {
        var migrationFolder = getRunFolder_(runId);
        var existingJob = migrationFolder.getFilesByName("job.json");
        var canMigrate = ["QUEUED", "RETRY_PENDING"].indexOf(run.Run_Status) >= 0 &&
          !run.Input_Manifest_File_ID && !existingJob.hasNext();
        if (!canMigrate) throw new Error("RUN_IDEMPOTENCY_KEY_MISMATCH");
        SheetsRepository.updateBy("Run_Log", "Run_ID", runId, { Idempotency_Key: idempotencyKey });
        run.Idempotency_Key = idempotencyKey;
      }
      if (!/^[a-f0-9]{64}$/.test(idempotencyKey)) throw new Error("RUN_IDEMPOTENCY_KEY_INVALID");
      var folder = getRunFolder_(runId);
      var job = {
        contract_version: CONTRACT_VERSION, manifest_version: 1,
        run_id: runId, logical_job_id: run.Logical_Job_ID,
        catalog_id: catalogId, source_pdf_file_id: catalog.Source_File_ID,
        source_sha256: catalog.SHA256, attempt_number: Number(run.Attempt_Number) || 1,
        parent_run_id: run.Parent_Run_ID || null, retry_reason: run.Retry_Reason || null,
        idempotency_key: idempotencyKey,
        extraction_profile: "text-ocr-candidates-v2", ocr_languages: "ara+eng",
        ocr_min_usable_chars: 40, run_folder_id: folder.getId()
      };
      var jobFile = immutableJobFile_(folder, job);
      var now = new Date().toISOString();
      var startedAt = run.Started_At instanceof Date ? run.Started_At.toISOString() : (run.Started_At || now);
      var leaseExpiresAt = new Date(Date.now() + 120 * 60 * 1000).toISOString();
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RUNNING", Current_Step: "WORKER_DISPATCH",
        Input_Manifest_File_ID: jobFile.getId(), Started_At: startedAt,
        Heartbeat_At: now, Worker_Lease_ID: "lease_" + Utilities.getUuid().replace(/-/g, ""),
        Lease_Expires_At: leaseExpiresAt, Error_Code: "", Error_Summary: ""
      });

      var url = "https://api.github.com/repos/Khater1984/industrial-catalog-system/actions/workflows/catalog-worker-dispatch.yml/dispatches";
      var payload = {
        ref: workflowRef,
        inputs: { run_id: runId, job_file_id: jobFile.getId() }
      };
      var lastError = "";
      for (var attempt = 1; attempt <= 3; attempt++) {
        var response;
        try {
          response = UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            headers: {
              Authorization: "Bearer " + token,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28"
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });
        } catch (err) {
          lastError = "GITHUB_NETWORK_ERROR";
          response = null;
        }
        if (response) {
          var code = response.getResponseCode();
          if (code === 204) {
            return { configured: true, accepted: true, run_id: runId, workflow: "catalog-worker-dispatch.yml" };
          }
          lastError = "GITHUB_HTTP_" + code;
          if (code >= 400 && code < 500 && code !== 408 && code !== 429) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
              Run_Status: "FAILED", Current_Step: "DISPATCH_REJECTED",
              Finished_At: new Date().toISOString(), Worker_Lease_ID: "", Lease_Expires_At: "",
              Error_Code: "GITHUB_WORKFLOW_REJECTED",
              Error_Summary: "GitHub rejected the workflow dispatch (" + code + "). Check workflow availability and token permissions."
            });
            throw new Error("GITHUB_WORKFLOW_REJECTED: " + code);
          }
        }
        if (attempt < 3) Utilities.sleep(1000 * Math.pow(2, attempt - 1));
      }
      // Re-dispatch uses the same immutable Run_ID/job.json. The worker is idempotent
      // and the workflow concurrency group prevents simultaneous execution per run.
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RETRY_PENDING", Current_Step: "DISPATCH_UNCONFIRMED",
        Error_Code: "GITHUB_DISPATCH_UNCONFIRMED",
        Error_Summary: "GitHub did not confirm workflow dispatch; retry with the same Run_ID. " + lastError
      });
      return { configured: true, accepted: false, retryable: true, run_id: runId };
    } finally {
      lock.releaseLock();
    }
  }
  function processCompletedRuns() {
    var runs = SheetsRepository.listAll("Run_Log"), processed = [], errors = [];
    runs.forEach(function (run) {
      var retryCandidateIntake = run.Run_Status === "COMPLETED" && run.Current_Step === "REVIEW_INTAKE_PENDING";
      if (["RUNNING", "RETRY_PENDING"].indexOf(run.Run_Status) < 0 && !retryCandidateIntake) return;
      if (!run.Input_Manifest_File_ID) return;
      try {
        var jobFile = DriveApp.getFileById(run.Input_Manifest_File_ID);
        var parents = jobFile.getParents();
        if (!parents.hasNext()) throw new Error("RUN_FOLDER_NOT_FOUND");
        var folder = parents.next(), files = folder.getFilesByName("result-manifest.json");
        if (!files.hasNext()) {
          var expiresAt = run.Lease_Expires_At ? new Date(run.Lease_Expires_At).getTime() : 0;
          if (expiresAt && expiresAt <= Date.now()) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Run_Status: "FAILED", Current_Step: "WORKER_LEASE_EXPIRED",
              Finished_At: new Date().toISOString(), Worker_Lease_ID: "", Lease_Expires_At: "",
              Error_Code: "WORKER_LEASE_EXPIRED",
              Error_Summary: "No terminal result manifest arrived before the worker lease expired."
            });
            errors.push({ run_id: run.Run_ID, code: "WORKER_LEASE_EXPIRED" });
          }
          return;
        }
        var resultFile = files.next();
        var result = Ingest.ingestManifest({
          runId: run.Run_ID, resultManifestFileId: resultFile.getId()
        });
        if (result.run_status === "COMPLETED") {
          run.Run_Status = "COMPLETED";
          run.Current_Step = "INGESTED";
          var reviewIntake = CandidateReviewIntake.intakeRun({
            runId: run.Run_ID, resultManifestFileId: resultFile.getId()
          });
          SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
            Current_Step: "REVIEW_READY", Error_Code: "", Error_Summary: ""
          });
          processed.push(Object.assign({}, result, { review_intake: reviewIntake }));
        } else {
          processed.push(result);
        }
      } catch (err) {
        var code = String(err && err.message ? err.message : "INGEST_FAILED").slice(0, 120);
        if (run.Run_Status === "COMPLETED") {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Current_Step: "REVIEW_INTAKE_PENDING",
              Error_Code: "CANDIDATE_REVIEW_INTAKE_FAILED", Error_Summary: code
            });
          } catch (ignore) {}
        } else if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) < 0) {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Error_Code: "RESULT_INGEST_REJECTED", Error_Summary: code
            });
          } catch (ignore) {}
        }
        errors.push({ run_id: run.Run_ID, code: code });
      }
    });
    return { processed: processed, errors: errors };
  }
  function installPoller() {
    var triggers = ScriptApp.getProjectTriggers();
    var exists = triggers.some(function (trigger) {
      return trigger.getHandlerFunction() === "processWorkerResults";
    });
    if (!exists) ScriptApp.newTrigger("processWorkerResults").timeBased().everyMinutes(5).create();
    return { installed: true, interval_minutes: 5, already_installed: exists };
  }
  return {
    dispatchCatalogRun: dispatchCatalogRun,
    processCompletedRuns: processCompletedRuns,
    installPoller: installPoller
  };
})();

function dispatchRegisteredCatalog_(registered) {
  if (!registered || ["QUEUED", "RETRY_PENDING"].indexOf(registered.status) < 0) {
    return { accepted: false, reason: "RUN_NOT_DISPATCHABLE", status: registered && registered.status || "" };
  }
  try {
    var result = WorkerIntegration.dispatchCatalogRun(registered.catalogId, registered.runId);
    if (result.accepted) registered.status = "RUNNING";
    else if (result.retryable) registered.status = "RETRY_PENDING";
    return result;
  } catch (err) {
    var message = String(err && err.message ? err.message : "WORKER_DISPATCH_FAILED");
    var match = message.match(/^([A-Z][A-Z0-9_]{2,80})/);
    var code = match ? match[1] : "WORKER_DISPATCH_FAILED";
    var rejected = code === "WORKER_REJECTED" || code === "GITHUB_WORKFLOW_REJECTED";
    if (rejected) registered.status = "FAILED";
    return { configured: true, accepted: false, retryable: !rejected, run_id: registered.runId,
      error_code: code };
  }
}

function processWorkerResults() {
  return WorkerIntegration.processCompletedRuns();
}

function installWorkerPoller() {
  assertPrimaryUser_();
  return WorkerIntegration.installPoller();
}


// ===== domain/StagingPromotion.js =====

/** Promotes accepted staging records into V2.1 Sheets tables.

Source specification rows are append-only. Reviewer edits are recorded in
Specification_Changes and never overwrite Specifications.Attribute_Value_Source.
There is no Specifications_Source table in Schema V2.1; the immutable source
row in Specifications is the source assertion.
*/
var StagingPromotion = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function text_(value, limit) {
    var text = value === undefined || value === null ? "" : String(value).trim();
    return text.length > limit ? text.slice(0, limit) : text;
  }
  function json_(value) { return JSON.stringify(value === undefined || value === null ? "" : value); }
  function confidence_(value) {
    if (typeof value === "number" && isFinite(value)) return value;
    var map = { HIGH: 0.95, MEDIUM: 0.7, LOW: 0.4 };
    return map[String(value || "").toUpperCase()] || "";
  }
  function require_(condition, code) { if (!condition) throw new Error(code); }
  function accepted_(record) { return record && record.review_status === "ACCEPTED"; }
  function sourceValue_(spec) {
    return spec.edited && Object.prototype.hasOwnProperty.call(spec, "original_value_raw")
      ? spec.original_value_raw : spec.value_raw;
  }

  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }
  function mapping_(operationId, stagingType, stagingId, productionType, productionId, canonicalType, canonicalId, decisionId, payload) {
    var existing = existingBy_("Promotion_Mappings", "Staging_ID", stagingId);
    if (existing && existing.Production_Entity_Type === productionType) return existing;
    var record = {
      Promotion_Mapping_ID: stableId_("pmap", operationId + "|" + stagingType + "|" + stagingId + "|" + productionType),
      Promotion_Operation_ID: operationId,
      Staging_Type: stagingType,
      Staging_ID: stagingId,
      Production_Entity_Type: productionType,
      Production_Entity_ID: productionId,
      Canonical_Entity_Type: canonicalType || "",
      Canonical_Entity_ID: canonicalId || "",
      Identity_Match_Decision_ID: decisionId || "",
      Payload_SHA256: sha_(json_(payload)),
      Created_At: now_()
    };
    appendOnce_("Promotion_Mappings", record);
    return record;
  }
  function audit_(actor, action, entityType, entityId, reason, runId, payload) {
    appendOnce_("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityType + "|" + entityId + "|" + reason),
      Event_Idempotency_Key: text_(action + "|" + entityType + "|" + entityId + "|" + reason, 180),
      Payload_SHA256: sha_(json_(payload)),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: text_(reason, 1000),
      Related_Run_ID: runId || ""
    });
  }
  function decision_(entityType, stagingType, stagingId, stagingHash, resultId, actor, parentDecisionId) {
    var existing = existingBy_("Identity_Match_Decisions", "Source_Staging_ID", stagingId);
    if (existing) return existing;
    var record = {
      Match_Decision_ID: stableId_("imd", stagingType + "|" + stagingId),
      Entity_Type: entityType,
      Source_Staging_Type: stagingType,
      Source_Staging_ID: stagingId,
      Source_Staging_Hash: stagingHash,
      Parent_Product_Match_Decision_ID: parentDecisionId || "",
      Decision: "CREATE_NEW",
      Result_Canonical_ID: resultId,
      Rationale: "Accepted staging record promoted as a new canonical identity.",
      Decided_At: now_(),
      Decided_By: actor
    };
    appendOnce_("Identity_Match_Decisions", record);
    return record;
  }

  function promoteReviewedStaging(options) {
    require_(options && options.stagingSetFileId && options.stagingSetSha256, "PROMOTION_ARGUMENTS_INVALID");
    if (options.staging) throw new Error("PROMOTION_CLIENT_STAGING_FORBIDDEN");
    require_(/^[A-Za-z0-9_-]{10,200}$/.test(options.stagingSetFileId), "PROMOTION_FILE_ID_INVALID");
    require_(/^[a-f0-9]{64}$/.test(options.stagingSetSha256), "PROMOTION_SHA_INVALID");
    var file = DriveApp.getFileById(options.stagingSetFileId);
    if (!file) throw new Error("STAGING_FILE_NOT_FOUND");
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var computed = sha_(bytes);
    require_(computed === options.stagingSetSha256, "STAGING_FILE_SHA_MISMATCH");
    var content = blob.getDataAsString();
    var staging;
    try { staging = JSON.parse(content); } catch (e) { throw new Error("STAGING_FILE_INVALID_JSON"); }
    require_(staging && Array.isArray(staging.products) && Array.isArray(staging.variants) && Array.isArray(staging.specifications), "STAGING_SET_INVALID");
    var actor = options.actor || APP.ACTOR_ID;
    var runId = text_(staging.run_id, 120);
    var catalogId = text_(staging.catalog_id, 120);
    var keyVersion = text_(staging.source_key_algorithm_version || "source-key-v1", 80);
    var promotionKey = text_("promote|" + runId + "|" + options.stagingSetSha256.slice(0, 32), 180);
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    var operationId = stableId_("pop", promotionKey);
    try {
      var existingOp = existingBy_("Promotion_Operations", "Promotion_Key", promotionKey);
      if (existingOp && existingOp.Operation_Status === "COMPLETED") {
        return { promotion_operation_id: existingOp.Promotion_Operation_ID, skipped: true, status: "COMPLETED" };
      }
      if (!existingOp) {
        SheetsRepository.append("Promotion_Operations", {
          Promotion_Operation_ID: operationId,
          Promotion_Key: promotionKey,
          Run_ID: runId,
          Operation_Status: "APPLYING",
          Staging_Set_Manifest_File_ID: options.stagingSetFileId,
          Staging_Set_SHA256: options.stagingSetSha256,
          Intended_Output_Manifest_File_ID: options.intendedOutputFileId || options.stagingSetFileId,
          Intended_Output_SHA256: options.intendedOutputSha256 || options.stagingSetSha256,
          Created_At: now_(),
          Created_By: actor,
          Started_At: now_()
        });
      } else {
        operationId = existingOp.Promotion_Operation_ID;
        SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, { Operation_Status: "APPLYING", Started_At: now_() });
      }

      var counts = { products: 0, variants: 0, specifications: 0, changes: 0, rejected: 0, skipped: 0 };
      var productIds = {};
      var variantIds = {};
      var productSourceIds = {};
      var productDecisionIds = {};

      staging.products.forEach(function (product) {
        if (!accepted_(product)) { counts.rejected += 1; return; }
        var sourceKey = text_(catalogId + "|" + product.catalog_page_id + "|" + product.proposed_product_name, 160);
        var productId = stableId_("prd", sourceKey);
        var existingSource = existingBy_("Product_Source_Records", "Source_Record_Key", sourceKey);
        if (existingSource) {
          productIds[product.staging_id] = existingSource.Product_ID;
          productSourceIds[product.staging_id] = existingSource.Product_Source_Record_ID;
          productDecisionIds[product.staging_id] = existingSource.Match_Decision_ID;
          counts.skipped += 1;
          return;
        }
        var hash = product.staging_record_hash || sha_(product.staging_id);
        var decision = decision_("PRODUCT", "STAGING_PRODUCT", product.staging_id, hash, productId, actor);
        if (!existingBy_("Products", "Product_ID", productId)) {
          appendOnce_("Products", {
            Product_ID: productId, Lifecycle_Status: "ACTIVE",
            Canonical_Notes: text_(product.proposed_product_name, 2000),
            Created_At: now_(), Created_By: actor
          });
          counts.products += 1;
        }
        var sourceId = stableId_("psr", sourceKey);
        appendOnce_("Product_Source_Records", {
          Product_Source_Record_ID: sourceId, Product_ID: productId, Catalog_ID: catalogId,
          Source_Record_Key: sourceKey, Source_Key_Algorithm_Version: keyVersion,
          Source_Product_Name: text_(product.proposed_product_name, 300),
          Catalog_Page_ID: product.catalog_page_id, Source_Quote: text_(product.source_quote, 2000),
          Extraction_Run_ID: runId, Extraction_Record_ID: product.staging_id,
          Identity_Resolution: "CREATE_NEW", Match_Decision_ID: decision.Match_Decision_ID,
          Created_At: now_(), Created_By: actor
        });
        mapping_(operationId, "PRODUCT", product.staging_id, "PRODUCT", productId, "PRODUCT", productId, decision.Match_Decision_ID, product);
        mapping_(operationId, "PRODUCT", product.staging_id, "PRODUCT_SOURCE_RECORD", sourceId, "PRODUCT", productId, decision.Match_Decision_ID, product);
        audit_(actor, "PROMOTE", "PRODUCT", productId, "Accepted staging product", runId, product);
        productIds[product.staging_id] = productId;
        productSourceIds[product.staging_id] = sourceId;
        productDecisionIds[product.staging_id] = decision.Match_Decision_ID;
      });

      staging.variants.forEach(function (variant) {
        if (!accepted_(variant)) { counts.rejected += 1; return; }
        var productId = productIds[variant.parent_staging_product_id];
        if (!productId) { counts.skipped += 1; return; }
        var sourceKey = text_(productId + "|" + variant.proposed_model_number, 160);
        var variantId = stableId_("var", sourceKey);
        var existingSource = existingBy_("Variant_Source_Records", "Source_Record_Key", sourceKey);
        if (existingSource) {
          variantIds[variant.staging_id] = existingSource.Variant_ID;
          counts.skipped += 1;
          return;
        }
        var hash = variant.staging_record_hash || sha_(variant.staging_id);
        var decision = decision_("VARIANT", "STAGING_VARIANT", variant.staging_id, hash, variantId, actor, productDecisionIds[variant.parent_staging_product_id]);
        if (!existingBy_("Variants", "Variant_ID", variantId)) {
          appendOnce_("Variants", {
            Variant_ID: variantId, Product_ID: productId, Lifecycle_Status: "ACTIVE",
            Canonical_Notes: text_(variant.proposed_model_number, 2000),
            Created_At: now_(), Created_By: actor
          });
          counts.variants += 1;
        }
        var sourceId = stableId_("vsr", sourceKey);
        appendOnce_("Variant_Source_Records", {
          Variant_Source_Record_ID: sourceId, Variant_ID: variantId,
          Product_Source_Record_ID: productSourceIds[variant.parent_staging_product_id],
          Source_Record_Key: sourceKey, Source_Key_Algorithm_Version: keyVersion,
          Source_Model_Number: text_(variant.proposed_model_number, 160),
          Source_Model_Name: text_(variant.proposed_model_name || variant.proposed_model_number, 250),
          Catalog_Page_ID: variant.catalog_page_id, Source_Quote: text_(variant.source_quote, 2000),
          Extraction_Run_ID: runId, Extraction_Record_ID: variant.staging_id,
          Identity_Resolution: "CREATE_NEW", Match_Decision_ID: decision.Match_Decision_ID,
          Created_At: now_(), Created_By: actor
        });
        mapping_(operationId, "VARIANT", variant.staging_id, "VARIANT", variantId, "VARIANT", variantId, decision.Match_Decision_ID, variant);
        mapping_(operationId, "VARIANT", variant.staging_id, "VARIANT_SOURCE_RECORD", sourceId, "VARIANT", variantId, decision.Match_Decision_ID, variant);
        audit_(actor, "PROMOTE", "VARIANT", variantId, "Accepted staging variant", runId, variant);
        variantIds[variant.staging_id] = variantId;
      });

      staging.specifications.forEach(function (spec) {
        if (!accepted_(spec)) { counts.rejected += 1; return; }
        var productId = productIds[spec.parent_staging_product_id];
        var variantId = variantIds[spec.parent_staging_variant_id];
        if (!productId || !variantId) { counts.skipped += 1; return; }
        var original = text_(sourceValue_(spec), 2000);
        var assertionKey = text_(variantId + "|" + spec.attribute_key_raw, 160);
        if (original) {
          var specId = stableId_("spec", assertionKey + "|" + original);
          if (!existingBy_("Specifications", "Specification_ID", specId)) {
            appendOnce_("Specifications", {
              Specification_ID: specId, Source_Assertion_Key: assertionKey,
              Source_Key_Algorithm_Version: keyVersion, Scope: "VARIANT",
              Product_ID: productId, Variant_ID: variantId,
              Attribute_Key_Source: text_(spec.attribute_key_raw, 160),
              Attribute_Value_Source: original, Unit_Source: text_(spec.unit_raw, 80),
              Normalized_Key: text_(spec.normalized_key || spec.attribute_key_raw, 160),
              Normalized_Value_JSON: json_(original),
              Normalized_Unit: text_(spec.normalized_unit || spec.unit_raw, 80),
              Catalog_Page_ID: spec.catalog_page_id, Source_Quote: text_(spec.source_quote, 2000),
              Extraction_Run_ID: runId, Extraction_Confidence: confidence_(spec.confidence),
              Created_At: now_(), Created_By: actor
            });
            counts.specifications += 1;
            audit_(actor, "PROMOTE", "SPECIFICATION", specId, "Accepted source specification", runId, spec);
          } else counts.skipped += 1;
          mapping_(operationId, "SPECIFICATION", spec.staging_id, "SPECIFICATION", specId, "VARIANT", variantId, "", spec);
          if (spec.edited && text_(spec.value_raw, 2000) && text_(spec.value_raw, 2000) !== original) {
            var changePayload = { before: original, after: spec.value_raw };
            var changeId = stableId_("chg", assertionKey + "|" + original + "|" + spec.value_raw);
            if (!existingBy_("Specification_Changes", "Specification_Change_ID", changeId)) {
              appendOnce_("Specification_Changes", {
                Specification_Change_ID: changeId, Logical_Specification_Key: text_(assertionKey, 180),
                Sequence_No: 1, Operation: "UPDATE", Target_Specification_ID: specId,
                Product_ID: productId, Variant_ID: variantId,
                Attribute_Key: text_(spec.attribute_key_raw, 160),
                Value_JSON: json_(spec.value_raw), Unit_Code: text_(spec.unit_raw, 40),
                Change_Status: "APPROVED", Reason: text_(spec.edit_reason || "Accepted reviewer edit", 1000),
                Created_At: now_(), Created_By: actor, Approved_At: now_(), Approved_By: actor,
                Approval_Payload_SHA256: sha_(json_(changePayload))
              });
              counts.changes += 1;
            }
          }
        } else if (text_(spec.value_raw, 2000)) {
          var addId = stableId_("chg", "ADD|" + assertionKey + "|" + spec.value_raw);
          if (!existingBy_("Specification_Changes", "Specification_Change_ID", addId)) {
            appendOnce_("Specification_Changes", {
              Specification_Change_ID: addId, Logical_Specification_Key: text_(assertionKey, 180),
              Sequence_No: 1, Operation: "ADD", Product_ID: productId, Variant_ID: variantId,
              Attribute_Key: text_(spec.attribute_key_raw, 160), Value_JSON: json_(spec.value_raw),
              Unit_Code: text_(spec.unit_raw, 40), Change_Status: "APPROVED",
              Reason: "Reviewer supplied a value missing from source.",
              Created_At: now_(), Created_By: actor, Approved_At: now_(), Approved_By: actor,
              Approval_Payload_SHA256: sha_(json_({ after: spec.value_raw }))
            });
            counts.changes += 1;
          }
        } else counts.skipped += 1;
      });

      SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, {
        Operation_Status: "COMPLETED", Finished_At: now_()
      });
      return { promotion_operation_id: operationId, status: "COMPLETED", counts: counts, skipped: false };
    } catch (err) {
      try {
        if (existingBy_("Promotion_Operations", "Promotion_Operation_ID", operationId)) {
          SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, {
            Operation_Status: "IN_DOUBT", Recovery_Notes: text_(String(err && err.message || err), 1500)
          });
        }
      } catch (statusErr) {}
      throw err;
    } finally {
      lock.releaseLock();
    }
  }

  return { promoteReviewedStaging: promoteReviewedStaging };
})();


// ===== domain/ImagePromotion.js =====

/** Promotes accepted image staging records into Image_Assets / Image_Links.

Images must already exist in Drive. This module refuses incomplete image metadata
instead of writing invalid rows that violate Schema V2.1.
*/
var ImagePromotion = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function text_(value, limit) {
    var text = value === undefined || value === null ? "" : String(value).trim();
    return text.length > limit ? text.slice(0, limit) : text;
  }
  function require_(condition, code) {
    if (!condition) throw new Error(code);
  }
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }
  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }

  function promoteAcceptedImages(options) {
    require_(options && Array.isArray(options.images), "IMAGE_PROMOTION_IMAGES_INVALID");
    var actor = options.actor || APP.ACTOR_ID;
    var catalogId = text_(options.catalog_id, 128);
    require_(catalogId, "IMAGE_CATALOG_ID_REQUIRED");
    var counts = { assets: 0, links: 0, skipped: 0 };
    var allowedMimeTypes = {
      "image/jpeg": true, "image/png": true, "image/webp": true,
      "image/gif": true, "image/tiff": true, "image/bmp": true,
      "image/jp2": true, "image/jpx": true, "image/x-ms-bmp": true
    };

    options.images.forEach(function (img) {
      if (!img || img.review_status !== "ACCEPTED") {
        counts.skipped += 1;
        return;
      }

      var digest = text_(img.sha256, 64).toLowerCase();
      require_(/^[a-f0-9]{64}$/.test(digest), "IMAGE_SHA256_INVALID");
      var driveFileId = text_(img.drive_file_id, 120);
      require_(driveFileId, "IMAGE_DRIVE_FILE_ID_REQUIRED");
      var originalName = text_(img.original_name, 255);
      var mimeType = text_(img.mime_type, 100).toLowerCase();
      var width = img.width_px;
      var height = img.height_px;
      var fileSize = img.file_size_bytes;
      require_(originalName && allowedMimeTypes[mimeType], "IMAGE_FILE_METADATA_REQUIRED");
      require_(typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= 50000, "IMAGE_WIDTH_REQUIRED");
      require_(typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= 50000, "IMAGE_HEIGHT_REQUIRED");
      require_(width * height <= 100000000, "IMAGE_PIXEL_LIMIT_EXCEEDED");
      require_(typeof fileSize === "number" && Number.isSafeInteger(fileSize) && fileSize > 0 && fileSize <= 26214400, "IMAGE_FILE_SIZE_REQUIRED");
      require_(typeof img.has_alpha === "boolean", "IMAGE_ALPHA_FLAG_REQUIRED");

      var imageId = stableId_("img", digest);
      var existingAsset = existingBy_("Image_Assets", "Image_ID", imageId);
      if (!existingAsset) {
        appendOnce_("Image_Assets", {
          Image_ID: imageId,
          Original_File_ID: driveFileId,
          Original_File_Name: originalName,
          MIME_Type: mimeType,
          Width_PX: width,
          Height_PX: height,
          File_Size_Bytes: fileSize,
          Has_Alpha: Boolean(img.has_alpha),
          Orientation: "NORMALIZED",
          SHA256: digest,
          Source_Type: "CATALOG_EMBEDDED",
          Source_Catalog_ID: catalogId,
          Source_Catalog_Page_ID: text_(img.catalog_page_id, 120),
          Source_Page_Label: text_(img.page_number, 80),
          Quality_Status: "UNASSESSED",
          Lifecycle_Status: "ACTIVE",
          Created_At: now_(),
          Created_By: actor
        });
        counts.assets += 1;
      }

      // Create a missing link even when the asset already exists (safe retry).
      if (img.target_type || img.target_id) {
        require_(img.target_type === "PRODUCT" || img.target_type === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
        require_(text_(img.target_id, 120), "IMAGE_TARGET_ID_REQUIRED");
        var linkId = stableId_("imgl", imageId + "|" + img.target_type + "|" + img.target_id);
        if (!existingBy_("Image_Links", "Image_Link_ID", linkId)) {
          appendOnce_("Image_Links", {
            Image_Link_ID: linkId,
            Image_ID: imageId,
            Target_Type: img.target_type,
            Target_ID: text_(img.target_id, 120),
            Is_Primary: false,
            Catalog_Approved: false,
            DataSheet_Approved: false,
            Catalog_Order: 0,
            DataSheet_Order: 0,
            Link_Status: "CANDIDATE",
            Created_At: now_(),
            Created_By: actor,
            Updated_At: now_(),
            Updated_By: actor
          });
          counts.links += 1;
        }
      }
    });

    return { status: "COMPLETED", counts: counts };
  }

  return { promoteAcceptedImages: promoteAcceptedImages };
})();


// ===== domain/ImageReviewIntake.js =====

/** Image Review Intake
 *
 * Verifies the worker's immutable image manifests and Drive objects, then
 * idempotently creates Staging_Images, Review_Queue and Review_Staging_Links.
 *
 * Deliberately does not write Image_Assets/Image_Links, associate products,
 * or invoke ImagePromotion.
 */
var ImageReviewIntake = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  var DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,200}$/;

  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function now_() { return new Date().toISOString(); }

  function bytes_(value) {
    return typeof value === "string" ? Utilities.newBlob(value, "application/json").getBytes() : value;
  }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes_(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  // Matches worker.images.canonical_json_bytes: UTF-8 JSON, sorted object keys,
  // compact separators, non-ASCII characters retained.
  function canonical_(value) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!isFinite(value)) fail_("MANIFEST_NONFINITE_NUMBER");
      return value;
    }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        if (value[key] === undefined) fail_("MANIFEST_UNDEFINED_VALUE");
        out[key] = canonical_(value[key]);
      });
      return out;
    }
    fail_("MANIFEST_VALUE_UNSUPPORTED");
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function withoutKey_(value, key) {
    var out = {};
    Object.keys(value).forEach(function (name) { if (name !== key) out[name] = value[name]; });
    return out;
  }
  function verifyRecordHash_(record, hashField, errorCode) {
    require_(record && typeof record[hashField] === "string" && SHA_RE.test(record[hashField]), errorCode);
    require_(sha_(canonicalJson_(withoutKey_(record, hashField))) === record[hashField], errorCode);
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 24); }
  function requireText_(value, code, maxLength) {
    require_(typeof value === "string" && value.trim().length > 0, code);
    var result = value.trim();
    if (maxLength) require_(result.length <= maxLength, code);
    return result;
  }
  function requireInteger_(value, code, minimum) {
    require_(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum, code);
    return value;
  }
  function idValid_(value) { return typeof value === "string" && DRIVE_ID_RE.test(value); }

  function loadManifest_(fileId, expectedSha, kind) {
    require_(idValid_(fileId), "MANIFEST_FILE_ID_INVALID");
    var file;
    try { file = DriveApp.getFileById(fileId); } catch (e) { fail_("MANIFEST_FILE_NOT_FOUND"); }
    require_(file, "MANIFEST_FILE_NOT_FOUND");
    var blob = file.getBlob();
    var rawBytes = blob.getBytes();
    var rawSha = sha_(rawBytes);
    if (expectedSha) {
      require_(typeof expectedSha === "string" && SHA_RE.test(expectedSha), "MANIFEST_EXPECTED_SHA_INVALID");
      require_(rawSha === expectedSha, "MANIFEST_FILE_SHA_MISMATCH");
    }
    var data;
    try { data = JSON.parse(blob.getDataAsString("UTF-8")); } catch (e) { fail_("MANIFEST_INVALID_JSON"); }
    require_(data && Object.prototype.toString.call(data) === "[object Object]", "MANIFEST_STRUCTURE_INVALID");
    verifyRecordHash_(data, "manifest_sha256", "MANIFEST_CHECKSUM_INVALID");
    require_(data.manifest_version === 1, "MANIFEST_VERSION_UNSUPPORTED");
    requireText_(data.catalog_id, "MANIFEST_CATALOG_INVALID", 120);
    requireText_(data.run_id, "MANIFEST_RUN_INVALID", 120);
    if (kind === "image") {
      require_(Array.isArray(data.images), "IMAGE_MANIFEST_IMAGES_INVALID");
      require_(data.image_count === data.images.length, "IMAGE_MANIFEST_COUNT_MISMATCH");
      data.images.forEach(function (image) {
        require_(image && Object.prototype.toString.call(image) === "[object Object]", "IMAGE_RECORD_INVALID");
        // Runner adds Drive pointers after extraction. The per-image worker
        // checksum intentionally covers the immutable extraction record only.
        var sourceImage = withoutKey_(withoutKey_(image, "drive_file_id"), "drive_sha256");
        verifyRecordHash_(sourceImage, "output_sha256", "IMAGE_RECORD_CHECKSUM_INVALID");
      });
    } else {
      require_(Array.isArray(data.images), "DRIVE_MANIFEST_IMAGES_INVALID");
      require_(data.image_count === data.images.length, "DRIVE_MANIFEST_COUNT_MISMATCH");
    }
    return { data: data, sha: rawSha };
  }

  function verifyDriveManifest_(imageData, driveData) {
    require_(driveData.catalog_id === imageData.catalog_id, "CATALOG_ID_MISMATCH");
    require_(driveData.run_id === imageData.run_id, "RUN_ID_MISMATCH");
    // The worker Drive manifest references the original extraction manifest.
    // Runner enriches the separately published image manifest with Drive IDs;
    // reconstruct the pre-enrichment manifest before comparing the source hash.
    var sourceCopy = withoutKey_(withoutKey_(imageData, "manifest_sha256"), "enabled");
    sourceCopy.images = imageData.images.map(function (image) {
      return withoutKey_(withoutKey_(image, "drive_file_id"), "drive_sha256");
    });
    require_(driveData.source_manifest_sha256 === sha_(canonicalJson_(sourceCopy)), "SOURCE_MANIFEST_SHA_MISMATCH");
    var counts = { UPLOADED: 0, REUSED: 0, FAILED: 0 };
    var sourceKeys = {};
    imageData.images.forEach(function (item) {
      require_(item && SHA_RE.test(String(item.sha256 || "")), "IMAGE_RECORD_SHA_INVALID");
      requireText_(item.artifact_path, "IMAGE_RECORD_PATH_INVALID", 500);
      var sourceKey = item.sha256 + "|" + item.artifact_path;
      require_(!sourceKeys[sourceKey], "IMAGE_RECORD_DUPLICATE");
      sourceKeys[sourceKey] = true;
    });
    require_(driveData.images.length === imageData.images.length, "DRIVE_IMAGE_SET_COUNT_MISMATCH");
    var seen = {};
    driveData.images.forEach(function (item) {
      require_(item && typeof item === "object", "DRIVE_IMAGE_RECORD_INVALID");
      var status = item.upload_status;
      require_(Object.prototype.hasOwnProperty.call(counts, status), "DRIVE_UPLOAD_STATUS_INVALID");
      counts[status] += 1;
      require_(SHA_RE.test(String(item.sha256 || "")), "DRIVE_IMAGE_SHA_INVALID");
      requireText_(item.artifact_path, "DRIVE_IMAGE_PATH_INVALID", 500);
      var key = item.sha256 + "|" + item.artifact_path;
      require_(Object.prototype.hasOwnProperty.call(sourceKeys, key), "DRIVE_IMAGE_UNMATCHED");
      require_(!seen[key], "DRIVE_IMAGE_DUPLICATE");
      seen[key] = true;
      if (status !== "FAILED") {
        require_(idValid_(item.drive_file_id), "DRIVE_FILE_ID_INVALID");
        require_(item.catalog_id === imageData.catalog_id && item.run_id === imageData.run_id, "DRIVE_IMAGE_IDENTITY_MISMATCH");
      }
    });
    Object.keys(sourceKeys).forEach(function (key) {
      require_(seen[key], "DRIVE_IMAGE_MISSING");
    });
    require_(driveData.uploaded_count === counts.UPLOADED &&
      driveData.reused_count === counts.REUSED &&
      driveData.failed_count === counts.FAILED &&
      driveData.stored_count === counts.UPLOADED + counts.REUSED, "DRIVE_MANIFEST_COUNTER_MISMATCH");
    var expectedOverall = counts.FAILED === 0 ? "COMPLETED" :
      (counts.UPLOADED + counts.REUSED > 0 ? "PARTIAL" : "FAILED");
    require_(driveData.overall_status === expectedOverall, "DRIVE_MANIFEST_STATUS_MISMATCH");
  }

  function verifyDriveFile_(driveFileId, expected) {
    require_(idValid_(driveFileId), "DRIVE_FILE_ID_INVALID");
    var file;
    try { file = DriveApp.getFileById(driveFileId); } catch (e) { fail_("DRIVE_FILE_NOT_FOUND"); }
    require_(file, "DRIVE_FILE_NOT_FOUND");
    var size = file.getSize();
    var mime = file.getMimeType();
    require_(size === expected.file_size_bytes, "DRIVE_FILE_SIZE_MISMATCH");
    require_(mime === expected.mime_type, "DRIVE_FILE_MIME_MISMATCH");
    var actualSha = sha_(file.getBlob().getBytes());
    require_(actualSha === expected.sha256, "DRIVE_FILE_SHA_MISMATCH");
    return { size: size, mime: mime, sha256: actualSha };
  }

  function existingBy_(table, column, value) {
    return SheetsRepository.getBy(table, column, value);
  }
  function compareExisting_(table, existing, expected, fields, code) {
    fields.forEach(function (field) {
      var actual = existing[field];
      var wanted = expected[field];
      if (actual instanceof Date && !isNaN(actual.getTime())) actual = actual.toISOString();
      if (String(actual === undefined || actual === null ? "" : actual) !==
          String(wanted === undefined || wanted === null ? "" : wanted)) fail_(code);
    });
  }
  function ensureRecord_(table, idColumn, record, compareFields, conflictCode) {
    var existing = existingBy_(table, idColumn, record[idColumn]);
    if (existing) {
      compareExisting_(table, existing, record, compareFields, conflictCode);
      return false;
    }
    SheetsRepository.append(table, record);
    return true;
  }

  function buildStaging_(img, driveImage, options, catalogId, runId, stagingId) {
    var name = requireText_(img.original_name, "IMAGE_ORIGINAL_NAME_MISSING", 255);
    var mime = requireText_(driveImage.mime_type, "IMAGE_MIME_TYPE_MISSING", 100);
    var size = requireInteger_(img.file_size_bytes, "IMAGE_FILE_SIZE_INVALID", 1);
    require_(driveImage.file_size_bytes === size, "DRIVE_MANIFEST_FILE_SIZE_MISMATCH");
    require_(img.sha256 === driveImage.sha256, "DRIVE_MANIFEST_SHA_MISMATCH");
    var record = {
      Staging_ID: stagingId,
      Run_ID: runId,
      Catalog_ID: catalogId,
      Raw_Extract_File_ID: options.imageManifestFileId,
      Extraction_Method: "IMAGE_EXTRACTION",
      Proposed_Status: "NEEDS_REVIEW",
      Proposed_Image_File_ID: driveImage.drive_file_id,
      Original_File_Name: name,
      MIME_Type: mime,
      File_Size_Bytes: size,
      SHA256: img.sha256,
      Quality_Status: "NEEDS_REVIEW"
    };
    if (img.catalog_page_id) record.Catalog_Page_ID = requireText_(img.catalog_page_id, "IMAGE_PAGE_ID_INVALID", 120);
    if (typeof img.extractor_version === "string" && img.extractor_version.trim()) {
      record.Extraction_Tool_Version = requireText_(img.extractor_version, "IMAGE_EXTRACTOR_VERSION_INVALID", 120);
    }
    if (img.width_px !== null && img.width_px !== undefined) record.Width_PX = requireInteger_(img.width_px, "IMAGE_WIDTH_INVALID", 1);
    if (img.height_px !== null && img.height_px !== undefined) record.Height_PX = requireInteger_(img.height_px, "IMAGE_HEIGHT_INVALID", 1);
    var hashPayload = withoutKey_(record, "Staging_Record_Hash");
    record.Staging_Record_Hash = sha_(canonicalJson_(hashPayload));
    record.Created_At = now_();
    record.Updated_At = record.Created_At;
    return record;
  }

  function intake(options) {
    require_(options && idValid_(options.imageManifestFileId) && idValid_(options.driveManifestFileId), "INTAKE_ARGUMENTS_INVALID");
    var imageManifest = loadManifest_(options.imageManifestFileId, options.imageManifestSha256, "image");
    var driveManifest = loadManifest_(options.driveManifestFileId, options.driveManifestSha256, "drive");
    var imgData = imageManifest.data, drvData = driveManifest.data;
    verifyDriveManifest_(imgData, drvData);

    var catalogId = requireText_(imgData.catalog_id, "CATALOG_OR_RUN_MISSING", 120);
    var runId = requireText_(imgData.run_id, "CATALOG_OR_RUN_MISSING", 120);
    var actor = requireText_(options.actor || APP.ACTOR_ID, "INTAKE_ACTOR_MISSING", 120);
    var driveByKey = {};
    drvData.images.forEach(function (item) {
      if (item.upload_status !== "FAILED") driveByKey[item.sha256 + "|" + item.artifact_path] = item;
    });
    var sourceKeys = {};
    imgData.images.forEach(function (item) {
      require_(item && SHA_RE.test(String(item.sha256 || "")), "IMAGE_RECORD_SHA_INVALID");
      requireText_(item.artifact_path, "IMAGE_RECORD_PATH_INVALID", 500);
      var key = item.sha256 + "|" + item.artifact_path;
      require_(!sourceKeys[key], "IMAGE_RECORD_DUPLICATE");
      sourceKeys[key] = true;
    });

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var counts = { staging: 0, reviews: 0, links: 0, reused: 0, skipped: 0, failed: 0, conflicts: 0 };
      var results = [];
      imgData.images.forEach(function (img) {
        var key = img.sha256 + "|" + img.artifact_path;
        var driveImage = driveByKey[key];
        if (!driveImage) {
          counts.skipped += 1;
          results.push({ sha256: img.sha256, status: "SKIPPED", reason: "DRIVE_UPLOAD_NOT_AVAILABLE" });
          return;
        }
        try {
          require_(driveImage.drive_file_id, "DRIVE_FILE_ID_MISSING");
          require_(driveImage.sha256 === img.sha256, "DRIVE_IMAGE_SHA_MISMATCH");
          if (img.drive_file_id) require_(img.drive_file_id === driveImage.drive_file_id, "DRIVE_FILE_ID_CONFLICT");
          if (img.drive_sha256) require_(img.drive_sha256 === driveImage.sha256, "DRIVE_SHA_CONFLICT");
          require_(driveImage.artifact_path === img.artifact_path, "DRIVE_IMAGE_PATH_MISMATCH");
          var size = requireInteger_(img.file_size_bytes, "IMAGE_FILE_SIZE_INVALID", 1);
          require_(driveImage.file_size_bytes === size, "DRIVE_MANIFEST_FILE_SIZE_MISMATCH");
          var mime = requireText_(driveImage.mime_type, "IMAGE_MIME_TYPE_MISSING", 100);
          if (img.mime_type) require_(img.mime_type === mime, "IMAGE_MIME_TYPE_CONFLICT");
          verifyDriveFile_(driveImage.drive_file_id, { file_size_bytes: size, mime_type: mime, sha256: img.sha256 });

          var stagingId = stableId_("stgimg", runId + "|" + img.sha256 + "|" + img.artifact_path);
          var staging = buildStaging_(img, driveImage, options, catalogId, runId, stagingId);
          var stagingFields = Object.keys(staging).filter(function (field) {
            return field !== "Created_At" && field !== "Updated_At";
          });
          var stagingCreated = ensureRecord_("Staging_Images", "Staging_ID", staging, stagingFields, "STAGING_CONFLICT");
          if (stagingCreated) counts.staging += 1;

          var reviewId = stableId_("revimg", stagingId);
          var review = {
            Review_Queue_ID: reviewId,
            Review_Type: "IMAGE_QUALITY",
            Priority: "NORMAL",
            Review_Status: "OPEN",
            Proposed_Action: "Review image quality and decide whether it is suitable for use.",
            Created_At: staging.Created_At,
            Created_By: actor
          };
          // Review status and assignment may be changed by a human after creation;
          // retries verify identity fields without resetting that human decision.
          var reviewCreated = ensureRecord_("Review_Queue", "Review_Queue_ID", review,
            ["Review_Type", "Priority", "Proposed_Action", "Created_By"], "REVIEW_QUEUE_CONFLICT");
          if (reviewCreated) counts.reviews += 1;

          var linkId = stableId_("rsl", reviewId + "|" + stagingId);
          var link = {
            Review_Staging_Link_ID: linkId,
            Review_Queue_ID: reviewId,
            Staging_ID: stagingId,
            Review_Role: "PRIMARY",
            Created_At: staging.Created_At,
            Created_By: actor
          };
          var linkCreated = ensureRecord_("Review_Staging_Links", "Review_Staging_Link_ID", link,
            ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"], "REVIEW_STAGING_LINK_CONFLICT");
          if (linkCreated) counts.links += 1;

          if (!stagingCreated && !reviewCreated && !linkCreated) counts.reused += 1;
          results.push({
            sha256: img.sha256, staging_id: stagingId, review_id: reviewId,
            status: stagingCreated || reviewCreated || linkCreated ? "CREATED_OR_COMPLETED" : "REUSED"
          });
        } catch (err) {
          var code = String(err && err.message ? err.message : "IMAGE_INTAKE_FAILED");
          counts.failed += 1;
          if (code.indexOf("CONFLICT") >= 0) counts.conflicts += 1;
          results.push({ sha256: img.sha256, status: "FAILED", reason: code });
        }
      });
      var finalStatus = counts.failed ? (counts.staging + counts.reviews + counts.links + counts.reused ? "PARTIAL" : "FAILED") : "COMPLETED";
      return {
        status: finalStatus,
        catalog_id: catalogId,
        run_id: runId,
        counts: counts,
        results: results
      };
    } finally {
      lock.releaseLock();
    }
  }

  return { intake: intake };
})();


// ===== domain/DocumentService.js =====

/**
 * Shared document library: immutable versions, explicit links and deterministic inheritance.
 * Binary originals live in the private DEV_DOCUMENTS_FOLDER_ID Drive folder.
 */
var DocumentService = (function () {
  function text_(value, max, code, required) {
    var s = value === null || value === undefined ? "" : String(value).trim();
    if (required && !s) throw new Error(code + "_REQUIRED");
    if (s.length > max) throw new Error(code + "_TOO_LONG");
    return s;
  }
  function id_(prefix) { return prefix + "_" + Utilities.getUuid().replace(/-/g, ""); }
  function now_() { return new Date().toISOString(); }
  function actor_(value) { return value || APP.ACTOR_ID; }
  function lock_() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error("DOCUMENT_LOCK_BUSY");
    return lock;
  }
  function rows_(table) { return SheetsRepository.listAll(table); }
  function one_(table, key, value) {
    var row = SheetsRepository.getBy(table, key, value);
    return row || null;
  }
  function digest_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
      .map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? "0" + v : v; }).join("");
  }
  function audit_(action, type, entityId, beforeValue, afterValue, reason) {
    var payload = JSON.stringify({ action: action, entity_type: type, entity_id: entityId,
      before: beforeValue || null, after: afterValue || null, reason: reason || "" });
    var hash = digest_(Utilities.newBlob(payload).getBytes());
    SheetsRepository.append("Audit_Log", {
      Audit_ID: id_("aud"), Event_Idempotency_Key: "document|" + action + "|" + entityId + "|" + hash.slice(0, 32),
      Payload_SHA256: hash, Event_At: now_(), Actor_ID: APP.ACTOR_ID, Action: action,
      Entity_Type: type, Entity_ID: entityId, Before_Value_JSON: beforeValue ? JSON.stringify(beforeValue).slice(0, 3000) : "",
      After_Value_JSON: afterValue ? JSON.stringify(afterValue).slice(0, 3000) : "", Reason: reason || ""
    });
  }
  function validateTarget_(type, targetId) {
    if (type === "PRODUCT") {
      if (!one_("Products", "Product_ID", targetId)) throw new Error("DOCUMENT_TARGET_NOT_FOUND");
      return { productId: targetId, variantId: "" };
    }
    if (type === "VARIANT") {
      var variant = one_("Variants", "Variant_ID", targetId);
      if (!variant) throw new Error("DOCUMENT_TARGET_NOT_FOUND");
      return { productId: String(variant.Product_ID), variantId: targetId };
    }
    throw new Error("DOCUMENT_TARGET_TYPE_INVALID");
  }
  function validateVersion_(docId, versionId) {
    if (!versionId) return null;
    var version = one_("Document_Versions", "Version_ID", versionId);
    if (!version || String(version.Doc_ID) !== String(docId)) throw new Error("DOCUMENT_VERSION_OWNERSHIP_MISMATCH");
    if (version.Lifecycle_Status !== "AVAILABLE") throw new Error("DOCUMENT_VERSION_NOT_AVAILABLE");
    return version;
  }
  function fileMetadata_(fileId) {
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(fileId || ""))) throw new Error("DOCUMENT_FILE_ID_INVALID");
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
    var mime = String(file.getMimeType() || blob.getContentType() || "").toLowerCase();
    if (mime !== "application/pdf") throw new Error("DOCUMENT_FILE_TYPE_UNSUPPORTED");
    if (bytes.length < 8 || bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("") !== "%PDF-") {
      throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
    }
    return { file: file, name: file.getName(), mime: mime, size: bytes.length, sha: digest_(bytes) };
  }
  function create_(payload, actor) {
    var p = payload || {};
    var title = text_(p.title, 250, "DOCUMENT_TITLE", true);
    var type = text_(p.documentType, 40, "DOCUMENT_TYPE", true);
    if (!ENUMS["Documents.Document_Type"] || ENUMS["Documents.Document_Type"].indexOf(type) < 0) throw new Error("DOCUMENT_TYPE_INVALID");
    var meta = fileMetadata_(p.driveFileId);
    var duplicate = rows_("Documents").filter(function (d) {
      return rows_("Document_Versions").some(function (v) { return v.Doc_ID === d.Doc_ID && v.SHA256 === meta.sha; });
    })[0];
    if (duplicate) throw new Error("DOCUMENT_DUPLICATE_FILE:" + duplicate.Doc_ID);
    var at = now_(), docId = id_("doc"), versionId = id_("docv");
    var doc = {
      Doc_ID: docId, Document_Type: type, Title: title,
      Language_Code: text_(p.languageCode, 10, "DOCUMENT_LANGUAGE", false),
      Description: text_(p.description, 1500, "DOCUMENT_DESCRIPTION", false),
      Current_Version_ID: "", Lifecycle_Status: "DRAFT",
      Created_At: at, Created_By: actor_(actor), Updated_At: at, Updated_By: actor_(actor)
    };
    var version = {
      Version_ID: versionId, Doc_ID: docId, Version_Label: text_(p.versionLabel || "Version 1", 80, "DOCUMENT_VERSION_LABEL", true),
      Drive_File_ID: String(p.driveFileId), Original_File_Name: meta.name, MIME_Type: meta.mime,
      File_Size_Bytes: meta.size, SHA256: meta.sha, Uploaded_At: at, Uploaded_By: actor_(actor),
      Version_Notes: text_(p.versionNotes, 1000, "DOCUMENT_VERSION_NOTES", false),
      Source_Type: "MANUAL_UPLOAD", Source_Catalog_ID: "", Source_Catalog_Page_ID: "",
      Source_Product_Source_Record_ID: "", Source_Variant_Source_Record_ID: "", Source_Quote: "",
      Source_URL: "", Extraction_Run_ID: "", Extraction_Record_ID: "", Supersedes_Version_ID: "",
      Lifecycle_Status: "AVAILABLE"
    };
    SheetsRepository.append("Documents", doc);
    try {
      SheetsRepository.append("Document_Versions", version);
      SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
        Current_Version_ID: versionId, Lifecycle_Status: "ACTIVE", Updated_At: now_(), Updated_By: actor_(actor)
      });
    } catch (err) {
      throw new Error("DOCUMENT_CREATE_PARTIAL:" + docId + ":" + String(err && err.message || err));
    }
    audit_("CREATE", "DOCUMENT", docId, null, { document: doc, version: version }, "Initial document upload");
    return { document: one_("Documents", "Doc_ID", docId), version: one_("Document_Versions", "Version_ID", versionId) };
  }
  function addVersion_(docId, payload, actor) {
    var p = payload || {}, doc = one_("Documents", "Doc_ID", docId);
    if (!doc || doc.Lifecycle_Status === "ARCHIVED") throw new Error("DOCUMENT_NOT_AVAILABLE");
    var meta = fileMetadata_(p.driveFileId);
    var versions = rows_("Document_Versions").filter(function (v) { return String(v.Doc_ID) === String(docId); });
    if (versions.some(function (v) { return v.SHA256 === meta.sha; })) throw new Error("DOCUMENT_VERSION_DUPLICATE");
    var current = validateVersion_(docId, doc.Current_Version_ID);
    var at = now_(), versionId = id_("docv");
    var version = {
      Version_ID: versionId, Doc_ID: docId, Version_Label: text_(p.versionLabel, 80, "DOCUMENT_VERSION_LABEL", true),
      Drive_File_ID: String(p.driveFileId), Original_File_Name: meta.name, MIME_Type: meta.mime,
      File_Size_Bytes: meta.size, SHA256: meta.sha, Uploaded_At: at, Uploaded_By: actor_(actor),
      Version_Notes: text_(p.versionNotes, 1000, "DOCUMENT_VERSION_NOTES", false),
      Source_Type: "MANUAL_UPLOAD", Source_Catalog_ID: "", Source_Catalog_Page_ID: "",
      Source_Product_Source_Record_ID: "", Source_Variant_Source_Record_ID: "", Source_Quote: "",
      Source_URL: "", Extraction_Run_ID: "", Extraction_Record_ID: "",
      Supersedes_Version_ID: current ? current.Version_ID : "", Lifecycle_Status: "AVAILABLE"
    };
    SheetsRepository.append("Document_Versions", version);
    SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
      Current_Version_ID: versionId, Lifecycle_Status: "ACTIVE", Updated_At: at, Updated_By: actor_(actor)
    });
    audit_("UPDATE", "DOCUMENT", docId, { Current_Version_ID: doc.Current_Version_ID }, { Current_Version_ID: versionId }, "New immutable document version");
    return version;
  }
  function link_(payload, actor) {
    var p = payload || {}, docId = text_(p.docId, 120, "DOCUMENT_ID", true);
    var type = text_(p.targetType, 20, "DOCUMENT_TARGET_TYPE", true);
    var targetId = text_(p.targetId, 120, "DOCUMENT_TARGET_ID", true);
    var mode = text_(p.linkMode || "INCLUDE", 20, "DOCUMENT_LINK_MODE", true);
    var doc = one_("Documents", "Doc_ID", docId);
    if (!doc || doc.Lifecycle_Status !== "ACTIVE") throw new Error("DOCUMENT_NOT_ACTIVE");
    var target = validateTarget_(type, targetId);
    if (type === "PRODUCT" && mode !== "INCLUDE") throw new Error("PRODUCT_DOCUMENT_EXCLUDE_FORBIDDEN");
    if (mode !== "INCLUDE" && mode !== "EXCLUDE") throw new Error("DOCUMENT_LINK_MODE_INVALID");
    var existing = rows_("Document_Links").filter(function (l) {
      return l.Doc_ID === docId && l.Target_Type === type && l.Target_ID === targetId && l.Link_Mode === mode;
    })[0];
    if (existing) return existing;
    if (mode === "EXCLUDE") {
      var inherited = rows_("Document_Links").some(function (l) {
        return l.Doc_ID === docId && l.Target_Type === "PRODUCT" && l.Target_ID === target.productId && l.Link_Mode === "INCLUDE";
      });
      if (!inherited) throw new Error("DOCUMENT_EXCLUDE_WITHOUT_INHERITED_LINK");
    }
    var pinned = validateVersion_(docId, p.pinnedVersionId || "");
    var link = {
      Link_ID: id_("docl"), Doc_ID: docId, Target_Type: type, Target_ID: targetId,
      Link_Mode: mode, Pinned_Version_ID: pinned ? pinned.Version_ID : "",
      Display_Order: Number.isInteger(p.displayOrder) ? p.displayOrder : 0,
      Created_At: now_(), Created_By: actor_(actor), Link_Notes: text_(p.notes, 500, "DOCUMENT_LINK_NOTES", false)
    };
    SheetsRepository.append("Document_Links", link);
    audit_("LINK", "DOCUMENT_LINK", link.Link_ID, null, link, "Document linked to " + type);
    return link;
  }
  function resolve_(type, targetId) {
    var target = validateTarget_(type, targetId);
    var docs = rows_("Documents"), versions = rows_("Document_Versions"), links = rows_("Document_Links");
    var productLinks = links.filter(function (l) {
      return l.Target_Type === "PRODUCT" && l.Target_ID === target.productId && l.Link_Mode === "INCLUDE";
    });
    var directLinks = type === "VARIANT" ? links.filter(function (l) {
      return l.Target_Type === "VARIANT" && l.Target_ID === targetId;
    }) : [];
    var excludes = {};
    directLinks.filter(function (l) { return l.Link_Mode === "EXCLUDE"; }).forEach(function (l) { excludes[l.Doc_ID] = true; });
    var chosen = {};
    productLinks.forEach(function (l) { if (!excludes[l.Doc_ID]) chosen[l.Doc_ID] = { link: l, inherited: true }; });
    directLinks.filter(function (l) { return l.Link_Mode === "INCLUDE"; }).forEach(function (l) {
      chosen[l.Doc_ID] = { link: l, inherited: false };
    });
    return Object.keys(chosen).map(function (docId) {
      var doc = docs.filter(function (d) { return d.Doc_ID === docId && d.Lifecycle_Status === "ACTIVE"; })[0];
      if (!doc) return null;
      var selected = chosen[docId], link = selected.link;
      var versionId = link.Pinned_Version_ID || doc.Current_Version_ID;
      var version = versions.filter(function (v) { return v.Version_ID === versionId && v.Doc_ID === docId && v.Lifecycle_Status === "AVAILABLE"; })[0];
      if (!version) return null;
      return { document: doc, version: version, link: link, inherited: selected.inherited };
    }).filter(Boolean).sort(function (a, b) {
      return Number(a.link.Display_Order || 0) - Number(b.link.Display_Order || 0) || String(a.document.Title).localeCompare(String(b.document.Title));
    });
  }
  function list_() {
    var docs = rows_("Documents"), versions = rows_("Document_Versions"), links = rows_("Document_Links");
    return docs.map(function (doc) {
      return { document: doc, versions: versions.filter(function (v) { return v.Doc_ID === doc.Doc_ID; }),
        links: links.filter(function (l) { return l.Doc_ID === doc.Doc_ID; }) };
    }).sort(function (a, b) { return String(b.document.Updated_At).localeCompare(String(a.document.Updated_At)); });
  }
  function archive_(docId, reason, actor) {
    var doc = one_("Documents", "Doc_ID", docId);
    if (!doc) throw new Error("DOCUMENT_NOT_FOUND");
    if (doc.Lifecycle_Status === "ARCHIVED") return doc;
    SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
      Lifecycle_Status: "ARCHIVED", Updated_At: now_(), Updated_By: actor_(actor)
    });
    audit_("ARCHIVE", "DOCUMENT", docId, { Lifecycle_Status: doc.Lifecycle_Status },
      { Lifecycle_Status: "ARCHIVED" }, text_(reason, 1000, "DOCUMENT_ARCHIVE_REASON", true));
    return one_("Documents", "Doc_ID", docId);
  }
  function withLock_(fn) { var lock = lock_(); try { return fn(); } finally { lock.releaseLock(); } }
  return {
    create: function (p, a) { return withLock_(function () { return create_(p, a); }); },
    addVersion: function (id, p, a) { return withLock_(function () { return addVersion_(id, p, a); }); },
    link: function (p, a) { return withLock_(function () { return link_(p, a); }); },
    resolve: resolve_, list: list_,
    archive: function (id, reason, a) { return withLock_(function () { return archive_(id, reason, a); }); }
  };
})();

/** Owner-only browser actions. Files are stored privately; no public Drive URL is returned. */
function createDocumentFromBrowser(payload) {
  assertPrimaryUser_();
  var p = payload || {};
  var name = String(p.fileName || "").trim();
  var encoded = String(p.base64 || "");
  if (!name || name.length > 255 || !/^[A-Za-z0-9._ ()\-\u0600-\u06FF]+$/.test(name)) throw new Error("DOCUMENT_FILE_NAME_INVALID");
  if (encoded.length > 16777216) throw new Error("DOCUMENT_FILE_TOO_LARGE");
  var bytes = Utilities.base64Decode(encoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
  var signature = bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("");
  if (signature !== "%PDF-") throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_DOCUMENTS_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_DOCUMENTS_FOLDER_ID");
  var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, "application/pdf", name));
  return DocumentService.create({
    title: p.title, documentType: p.documentType, languageCode: p.languageCode,
    description: p.description, versionLabel: p.versionLabel || "Version 1",
    versionNotes: p.versionNotes, driveFileId: file.getId()
  }, APP.ACTOR_ID);
}
function addDocumentVersionFromBrowser(payload) {
  assertPrimaryUser_();
  var p = payload || {}, name = String(p.fileName || "").trim(), encoded = String(p.base64 || "");
  if (!name || name.length > 255 || encoded.length > 16777216) throw new Error("DOCUMENT_UPLOAD_INVALID");
  var bytes = Utilities.base64Decode(encoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
  var signature = bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("");
  if (signature !== "%PDF-") throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_DOCUMENTS_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_DOCUMENTS_FOLDER_ID");
  var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, "application/pdf", name));
  return DocumentService.addVersion(p.docId, {
    driveFileId: file.getId(), versionLabel: p.versionLabel, versionNotes: p.versionNotes
  }, APP.ACTOR_ID);
}
function listDocumentsForBrowser() { assertPrimaryUser_(); return DocumentService.list(); }
function linkDocumentFromBrowser(payload) { assertPrimaryUser_(); return DocumentService.link(payload, APP.ACTOR_ID); }
function resolveDocumentsForBrowser(targetType, targetId) { assertPrimaryUser_(); return DocumentService.resolve(targetType, targetId); }
function archiveDocumentFromBrowser(docId, reason) { assertPrimaryUser_(); return DocumentService.archive(docId, reason, APP.ACTOR_ID); }


// ===== domain/BackupService.js =====

var BackupService=(function(){
 function now_(){return new Date().toISOString();}
 function sha_(v){var b=typeof v==="string"?Utilities.newBlob(v).getBytes():v;return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,b).map(function(x){var h=(x<0?x+256:x).toString(16);return h.length===1?"0"+h:h;}).join("");}
 function parent_(){var id=PropertiesService.getScriptProperties().getProperty("DEV_BACKUP_FOLDER_ID");if(!id)throw new Error("CONFIG_MISSING: DEV_BACKUP_FOLDER_ID");return DriveApp.getFolderById(id);}
 function refs_(){var out={};Object.keys(TABLES).forEach(function(t){var hs=TABLES[t];SheetsRepository.listAll(t).forEach(function(r){hs.forEach(function(c){var rule=FIELD_RULES[t+"."+c],v=r[c];if(!rule||!(rule.type==="DRIVE_FILE_ID"||rule.type==="JSON_FILE_ID")||!v)return;var x=out[String(v)]||(out[String(v)]={file_id:String(v),source_refs:[],expected_sha256:""});x.source_refs.push(t+"."+c);var d=r.SHA256||r.Config_SHA256||r.PDF_SHA256||r.Snapshot_SHA256||"";if(/^[a-f0-9]{64}$/.test(String(d||"")))x.expected_sha256=String(d);});});});return Object.keys(out).sort().map(function(k){return out[k];});}
 function create(){var lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw new Error("BACKUP_LOCK_BUSY");try{
  var stamp=now_(),folder=parent_().createFolder("backup_"+Utilities.getUuid().replace(/-/g,"")),tables=[],errors=[],files=[];
  Object.keys(TABLES).sort().forEach(function(t){var rows=SheetsRepository.listAll(t),body=JSON.stringify({schema_version:APP.SCHEMA_VERSION,table:t,exported_at:stamp,record_count:rows.length,records:rows}),f=folder.createFile(t+".json",body,"application/json");tables.push({table:t,file_id:f.getId(),sha256:sha_(body),record_count:rows.length});});
  refs_().forEach(function(ref){try{var src=DriveApp.getFileById(ref.file_id),copy=src.makeCopy(src.getName(),folder);files.push({file_id:ref.file_id,backup_file_id:copy.getId(),name:src.getName(),mime_type:src.getMimeType(),size_bytes:src.getSize(),expected_sha256:ref.expected_sha256,source_refs:ref.source_refs});}catch(e){errors.push({file_id:ref.file_id,source_refs:ref.source_refs,error_code:"DRIVE_FILE_BACKUP_FAILED"});}});
  var manifest={manifest_version:"1",backup_id:folder.getName(),schema_version:APP.SCHEMA_VERSION,created_at:stamp,backup_status:errors.length?"INCOMPLETE":"COMPLETE",table_count:tables.length,drive_reference_count:tables.length?files.length+errors.length:0,drive_copy_count:files.length,errors:errors,tables:tables,drive_files:files};
  var mf=folder.createFile("backup-manifest.json",JSON.stringify(manifest),"application/json");
  return {backup_id:manifest.backup_id,folder_id:folder.getId(),manifest_file_id:mf.getId(),status:manifest.backup_status,table_count:tables.length,drive_copy_count:files.length,error_count:errors.length};
 }finally{lock.releaseLock();}}
 function verify(folderId){if(!/^[A-Za-z0-9_-]{10,200}$/.test(String(folderId||"")))throw new Error("BACKUP_FOLDER_ID_INVALID");var folder=DriveApp.getFolderById(folderId),it=folder.getFilesByName("backup-manifest.json");if(!it.hasNext())throw new Error("BACKUP_MANIFEST_NOT_FOUND");var m=JSON.parse(it.next().getBlob().getDataAsString("UTF-8"));if(!m||m.manifest_version!=="1"||!Array.isArray(m.tables)||!Array.isArray(m.drive_files))throw new Error("BACKUP_MANIFEST_INVALID");var failures=[],ct=0,cf=0;
  m.tables.forEach(function(e){try{var f=DriveApp.getFileById(e.file_id),raw=f.getBlob().getDataAsString("UTF-8"),p=JSON.parse(raw);if(sha_(raw)!==e.sha256||p.table!==e.table||p.record_count!==e.record_count||!Array.isArray(p.records)||p.records.length!==e.record_count)throw new Error("INVALID");ct++;}catch(x){failures.push({item:e.table,error_code:"TABLE_BACKUP_INVALID"});}});
  m.drive_files.forEach(function(e){try{var src=DriveApp.getFileById(e.file_id),copy=DriveApp.getFileById(e.backup_file_id);if(Number(src.getSize())!==Number(copy.getSize()))throw new Error("SIZE");if(e.expected_sha256&&sha_(copy.getBlob().getBytes())!==e.expected_sha256)throw new Error("HASH");cf++;}catch(x){failures.push({item:e.file_id,error_code:"DRIVE_COPY_INVALID"});}});
  return {backup_id:m.backup_id,status:failures.length?"FAILED":(m.backup_status==="COMPLETE"?"VERIFIED":"INCOMPLETE"),checked_tables:ct,expected_tables:m.tables.length,checked_drive_files:cf,expected_drive_files:m.drive_files.length,failures:failures,restore_performed:false,notice:"Verification only; no live data was modified."};
 }
 return {create:create,verify:verify};
})();
function createDevBackup(){assertPrimaryUser_();return BackupService.create();}
function verifyDevBackup(folderId){assertPrimaryUser_();return BackupService.verify(folderId);}


// ===== domain/DesignService.js =====

/** Version-pinned identity, paper and template configuration management. */
var DesignService=(function(){
 function now_(){return new Date().toISOString();}
 function id_(p){return p+"_"+Utilities.getUuid().replace(/-/g,"");}
 function rows_(t){return SheetsRepository.listAll(t);}
 function one_(t,k,v){return SheetsRepository.getBy(t,k,v);}
 function text_(v,n,code,required){var s=v===undefined||v===null?"":String(v).trim();if(required&&!s)throw new Error(code+"_REQUIRED");if(s.length>n)throw new Error(code+"_TOO_LONG");return s;}
 function canonical_(v){if(Array.isArray(v))return v.map(canonical_);if(v&&typeof v==="object"){var o={};Object.keys(v).sort().forEach(function(k){o[k]=canonical_(v[k]);});return o;}return v;}
 function hash_(bytes){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes).map(function(b){var h=(b<0?b+256:b).toString(16);return h.length===1?"0"+h:h;}).join("");}
 function folder_(){var f=PropertiesService.getScriptProperties().getProperty("DEV_DESIGN_FOLDER_ID");if(!f)throw new Error("CONFIG_MISSING: DEV_DESIGN_FOLDER_ID");return DriveApp.getFolderById(f);}
 function saveConfig_(kind,entityId,config){
  if(!config||Object.prototype.toString.call(config)!=="[object Object]")throw new Error("DESIGN_CONFIG_INVALID");
  var normalized=canonical_(config);normalized.config_schema_version=normalized.config_schema_version||"1";
  var body=JSON.stringify(normalized);if(body.length>100000)throw new Error("DESIGN_CONFIG_TOO_LARGE");
  var digest=hash_(Utilities.newBlob(body).getBytes());
  var file=folder_().createFile(kind.toLowerCase()+"-"+entityId+"-"+digest.slice(0,12)+".json",body,"application/json");
  return {file_id:file.getId(),sha256:digest,config:normalized};
 }
 function checkAssetRefs_(config){
  var refs=config.asset_refs||[];
  if(!Array.isArray(refs))throw new Error("DESIGN_ASSET_REFS_INVALID");
  refs.forEach(function(ref){
   if(!ref||typeof ref.design_asset_id!=="string")throw new Error("DESIGN_ASSET_REF_INVALID");
   var asset=one_("Design_Assets","Design_Asset_ID",ref.design_asset_id);
   if(!asset)throw new Error("DESIGN_ASSET_NOT_FOUND");
   if(ref.sha256&&String(ref.sha256)!==String(asset.SHA256))throw new Error("DESIGN_ASSET_HASH_MISMATCH");
  });
 }
 function nextVersion_(table,key,id){return rows_(table).filter(function(r){return r[key]===id;}).reduce(function(m,r){return Math.max(m,Number(r.Version_Number)||0);},0)+1;}
 function audit_(action,type,entityId,before,after){
  var body=JSON.stringify({action:action,type:type,id:entityId,before:before||null,after:after||null});
  SheetsRepository.append("Audit_Log",{Audit_ID:id_("aud"),Event_Idempotency_Key:"design|"+action+"|"+entityId+"|"+hash_(Utilities.newBlob(body).getBytes()).slice(0,32),Payload_SHA256:hash_(Utilities.newBlob(body).getBytes()),Event_At:now_(),Actor_ID:APP.ACTOR_ID,Action:action,Entity_Type:type,Entity_ID:entityId,Before_Value_JSON:before?JSON.stringify(before).slice(0,3000):"",After_Value_JSON:after?JSON.stringify(after).slice(0,3000):""});
 }
 function registerAsset(p){
  var file=DriveApp.getFileById(p.driveFileId),bytes=file.getBlob().getBytes(),mime=String(file.getMimeType()||"");
  var type=text_(p.assetType,40,"DESIGN_ASSET_TYPE",true);
  if(!ENUMS["Design_Assets.Asset_Type"]||ENUMS["Design_Assets.Asset_Type"].indexOf(type)<0)throw new Error("DESIGN_ASSET_TYPE_INVALID");
  var digest=hash_(bytes),dupe=rows_("Design_Assets").filter(function(a){return a.SHA256===digest&&a.MIME_Type===mime;})[0];
  if(dupe)return dupe;
  var asset={Design_Asset_ID:id_("dasset"),Asset_Type:type,Asset_Name:text_(p.assetName||file.getName(),180,"DESIGN_ASSET_NAME",true),Drive_File_ID:file.getId(),MIME_Type:mime,File_Size_Bytes:bytes.length,SHA256:digest,License_Notes:text_(p.licenseNotes,1000,"DESIGN_ASSET_LICENSE",false),Created_At:now_(),Created_By:APP.ACTOR_ID};
  SheetsRepository.append("Design_Assets",asset);audit_("CREATE","DESIGN_ASSET",asset.Design_Asset_ID,null,asset);return asset;
 }
 function createLogical_(table,idField,nameField,name,description,typeField,typeValue,identityType){
  var label=text_(name,160,"DESIGN_NAME",true);
  if(rows_(table).some(function(r){return String(r[nameField]).toLowerCase()===label.toLowerCase();}))throw new Error("DESIGN_NAME_DUPLICATE");
  var row={};row[idField]=id_(idField.toLowerCase());row[nameField]=label;
  if(description!==undefined&&TABLES[table].indexOf("Description")>=0)row.Description=text_(description,1000,"DESIGN_DESCRIPTION",false);
  if(typeField)row[typeField]=typeValue;
  if(table==="Brands"){row.Identity_Type=identityType||"COMPANY";row.Lifecycle_Status="ACTIVE";}
  else row.Lifecycle_Status="ACTIVE";
  row.Created_At=now_();row.Created_By=APP.ACTOR_ID;SheetsRepository.append(table,row);return row;
 }
 function createBrand(p){
  var brand=createLogical_("Brands","Brand_ID","Brand_Name",p.name,p.description,"Identity_Type",p.identityType||"COMPANY",p.identityType||"COMPANY");
  var cfg=saveConfig_("BRAND",brand.Brand_ID,p.config||{config_schema_version:"1",palette:{},typography:{},logos:{},layout:{},asset_refs:[]});
  checkAssetRefs_(cfg.config);
  var ver={Brand_Version_ID:id_("bver"),Brand_ID:brand.Brand_ID,Version_Number:1,Version_Status:"DRAFT",Design_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256,Published_At:"",Published_By:"",Change_Notes:text_(p.changeNotes,1500,"DESIGN_CHANGE_NOTES",false),Created_At:now_(),Created_By:APP.ACTOR_ID};
  SheetsRepository.append("Brand_Versions",ver);audit_("CREATE","BRAND",brand.Brand_ID,null,{brand:brand,version:ver});return {brand:brand,version:ver};
 }
 function createTemplate(p){
  var docType=text_(p.documentType,40,"TEMPLATE_DOCUMENT_TYPE",true);
  if(ENUMS["Templates.Document_Type"].indexOf(docType)<0)throw new Error("TEMPLATE_DOCUMENT_TYPE_INVALID");
  var row=createLogical_("Templates","Template_ID","Template_Name",p.name,p.description,"Document_Type",docType);
  var cfg=saveConfig_("TEMPLATE",row.Template_ID,p.config||{config_schema_version:"1",page:{size:"A4",orientation:"portrait"},sections:[],asset_refs:[]});checkAssetRefs_(cfg.config);
  var ver={Template_Version_ID:id_("tver"),Template_ID:row.Template_ID,Version_Number:1,Version_Status:"DRAFT",Template_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256,Preview_File_ID:"",Published_At:"",Published_By:"",Change_Notes:text_(p.changeNotes,1500,"DESIGN_CHANGE_NOTES",false),Created_At:now_(),Created_By:APP.ACTOR_ID};
  SheetsRepository.append("Template_Versions",ver);audit_("CREATE","TEMPLATE",row.Template_ID,null,{template:row,version:ver});return {template:row,version:ver};
 }
 function createPaper(p){
  var row=createLogical_("Papers","Paper_ID","Paper_Name",p.name,"");
  var config=p.config||{config_schema_version:"1",page_size:"A4",orientation:"portrait",background:{type:"solid",color:"#FFFFFF"},margins_mm:{top:12,right:12,bottom:12,left:12}};
  var cfg=saveConfig_("PAPER",row.Paper_ID,config);checkAssetRefs_(cfg.config);
  var textureId=text_(p.textureAssetId,120,"PAPER_TEXTURE_ASSET",false),texture=textureId?one_("Design_Assets","Design_Asset_ID",textureId):null;
  if(textureId&&!texture)throw new Error("DESIGN_ASSET_NOT_FOUND");
  var ver={Paper_Version_ID:id_("pver"),Paper_ID:row.Paper_ID,Version_Number:1,Version_Status:"DRAFT",Paper_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256,Texture_Asset_ID:textureId,Texture_SHA256:texture?texture.SHA256:"",Published_At:"",Published_By:"",Created_At:now_(),Created_By:APP.ACTOR_ID};
  SheetsRepository.append("Paper_Versions",ver);audit_("CREATE","PAPER",row.Paper_ID,null,{paper:row,version:ver});return {paper:row,version:ver};
 }
 function updateDraft_(table,idField,id,config,notes){
  var version=one_(table,idField,id);if(!version)throw new Error("DESIGN_VERSION_NOT_FOUND");
  if(version.Version_Status!=="DRAFT")throw new Error("PUBLISHED_DESIGN_VERSION_IMMUTABLE");
  var kind=table==="Brand_Versions"?"BRAND":table==="Template_Versions"?"TEMPLATE":"PAPER";
  var cfg=saveConfig_(kind,id,config);checkAssetRefs_(cfg.config);
  if(table==="Brand_Versions")SheetsRepository.updateBy(table,idField,id,{Design_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256,Change_Notes:text_(notes,1500,"DESIGN_CHANGE_NOTES",false)});
  if(table==="Template_Versions")SheetsRepository.updateBy(table,idField,id,{Template_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256,Change_Notes:text_(notes,1500,"DESIGN_CHANGE_NOTES",false)});
  if(table==="Paper_Versions")SheetsRepository.updateBy(table,idField,id,{Paper_Config_File_ID:cfg.file_id,Config_SHA256:cfg.sha256});
  audit_("UPDATE","DESIGN_VERSION",id,{Config_SHA256:version.Config_SHA256},{Config_SHA256:cfg.sha256});return one_(table,idField,id);
 }
 function publish_(table,idField,id,configField,hashField){
  var v=one_(table,idField,id);if(!v)throw new Error("DESIGN_VERSION_NOT_FOUND");
  if(v.Version_Status!=="DRAFT")throw new Error("DESIGN_VERSION_NOT_DRAFT");
  var f=DriveApp.getFileById(v[configField]),body=f.getBlob().getDataAsString("UTF-8"),digest=hash_(Utilities.newBlob(body).getBytes());
  if(digest!==v[hashField])throw new Error("DESIGN_CONFIG_HASH_MISMATCH");
  var config=JSON.parse(body);checkAssetRefs_(config);
  var patch={Version_Status:"PUBLISHED",Published_At:now_(),Published_By:APP.ACTOR_ID};
  SheetsRepository.updateBy(table,idField,id,patch);audit_("PUBLISH","DESIGN_VERSION",id,{Version_Status:"DRAFT"},{Version_Status:"PUBLISHED",Config_SHA256:digest});return one_(table,idField,id);
 }
 function newDraft_(table,entityTable,entityKey,entityId,idField,configField,hashField,prefix){
  if(!one_(entityTable,entityKey,entityId))throw new Error("DESIGN_ENTITY_NOT_FOUND");
  var versions=rows_(table).filter(function(v){return String(v[entityKey])===String(entityId);});
  if(!versions.length)throw new Error("DESIGN_VERSION_NOT_FOUND");
  var latest=versions.sort(function(a,b){return Number(b.Version_Number)-Number(a.Version_Number);})[0];
  if(latest.Version_Status==="DRAFT")throw new Error("DESIGN_DRAFT_ALREADY_EXISTS");
  var source=versions.filter(function(v){return v.Version_Status==="PUBLISHED";}).sort(function(a,b){return Number(b.Version_Number)-Number(a.Version_Number);})[0];
  if(!source)throw new Error("DESIGN_PUBLISHED_VERSION_REQUIRED");
  var raw=DriveApp.getFileById(source[configField]).getBlob().getDataAsString("UTF-8");
  if(hash_(Utilities.newBlob(raw).getBytes())!==source[hashField])throw new Error("DESIGN_CONFIG_HASH_MISMATCH");
  var config=JSON.parse(raw);checkAssetRefs_(config);var cfg=saveConfig_(prefix,entityId,config);
  var version={};version[idField]=id_(idField.toLowerCase());version[entityKey]=entityId;
  version.Version_Number=Number(latest.Version_Number)+1;version.Version_Status="DRAFT";
  version[configField]=cfg.file_id;version[hashField]=cfg.sha256;
  if(table==="Brand_Versions"||table==="Template_Versions")version.Change_Notes="New draft cloned from published version "+source.Version_Number;
  if(table==="Template_Versions")version.Preview_File_ID="";
  if(table==="Brand_Versions"||table==="Template_Versions"){version.Published_At="";version.Published_By="";}
  version.Created_At=now_();version.Created_By=APP.ACTOR_ID;
  SheetsRepository.append(table,version);audit_("CREATE","DESIGN_VERSION",version[idField],null,version);return version;
 }
 function attachBrandAsset(p){
  var brand=one_("Brands","Brand_ID",p.brandId),asset=one_("Design_Assets","Design_Asset_ID",p.designAssetId);
  if(!brand||!asset)throw new Error("DESIGN_ASSET_LINK_TARGET_MISSING");
  var role=text_(p.usageRole,40,"BRAND_ASSET_ROLE",true);
  if(!ENUMS["Brand_Assets.Usage_Role"]||ENUMS["Brand_Assets.Usage_Role"].indexOf(role)<0)throw new Error("BRAND_ASSET_ROLE_INVALID");
  var existing=rows_("Brand_Assets").filter(function(x){return x.Brand_ID===p.brandId&&x.Design_Asset_ID===p.designAssetId&&x.Usage_Role===role;})[0];
  if(existing)return existing;
  var row={Brand_Asset_ID:id_("basset"),Brand_ID:p.brandId,Design_Asset_ID:p.designAssetId,Usage_Role:role,Lifecycle_Status:"ACTIVE",Created_At:now_(),Created_By:APP.ACTOR_ID};
  SheetsRepository.append("Brand_Assets",row);audit_("LINK","BRAND_ASSET",row.Brand_Asset_ID,null,row);return row;
 }
 function linkTemplateIdentity(p){
  var t=one_("Templates","Template_ID",p.templateId),b=one_("Brands","Brand_ID",p.brandId);if(!t||!b)throw new Error("DESIGN_IDENTITY_LINK_TARGET_MISSING");
  var active=rows_("Template_Identity_Links").filter(function(x){return x.Template_ID===p.templateId&&x.Brand_ID===p.brandId&&x.Status==="ACTIVE";})[0];
  if(active){if(p.isDefault&&!active.Is_Default)SheetsRepository.updateBy("Template_Identity_Links","Template_Identity_Link_ID",active.Template_Identity_Link_ID,{Is_Default:true});return active;}
  if(p.isDefault)rows_("Template_Identity_Links").filter(function(x){return x.Template_ID===p.templateId&&x.Status==="ACTIVE"&&x.Is_Default;}).forEach(function(x){SheetsRepository.updateBy("Template_Identity_Links","Template_Identity_Link_ID",x.Template_Identity_Link_ID,{Is_Default:false});});
  var link={Template_Identity_Link_ID:id_("til"),Template_ID:p.templateId,Brand_ID:p.brandId,Is_Default:Boolean(p.isDefault),Status:"ACTIVE",Created_At:now_()};
  SheetsRepository.append("Template_Identity_Links",link);audit_("LINK","TEMPLATE_IDENTITY",link.Template_Identity_Link_ID,null,link);return link;
 }
 function list(){return {assets:rows_("Design_Assets"),brands:rows_("Brands"),brandVersions:rows_("Brand_Versions"),papers:rows_("Papers"),paperVersions:rows_("Paper_Versions"),templates:rows_("Templates"),templateVersions:rows_("Template_Versions"),templateIdentityLinks:rows_("Template_Identity_Links")};}
 return {registerAsset:registerAsset,createBrand:createBrand,createTemplate:createTemplate,createPaper:createPaper,updateBrandDraft:function(id,c,n){return updateDraft_("Brand_Versions","Brand_Version_ID",id,c,n);},updateTemplateDraft:function(id,c,n){return updateDraft_("Template_Versions","Template_Version_ID",id,c,n);},updatePaperDraft:function(id,c){return updateDraft_("Paper_Versions","Paper_Version_ID",id,c,"");},publishBrand:function(id){return publish_("Brand_Versions","Brand_Version_ID",id,"Design_Config_File_ID","Config_SHA256");},publishTemplate:function(id){return publish_("Template_Versions","Template_Version_ID",id,"Template_Config_File_ID","Config_SHA256");},publishPaper:function(id){return publish_("Paper_Versions","Paper_Version_ID",id,"Paper_Config_File_ID","Config_SHA256");},linkTemplateIdentity:linkTemplateIdentity,attachBrandAsset:attachBrandAsset,newBrandDraft:function(id){return newDraft_("Brand_Versions","Brands","Brand_ID",id,"Brand_Version_ID","Design_Config_File_ID","Config_SHA256","BRAND");},newTemplateDraft:function(id){return newDraft_("Template_Versions","Templates","Template_ID",id,"Template_Version_ID","Template_Config_File_ID","Config_SHA256","TEMPLATE");},newPaperDraft:function(id){return newDraft_("Paper_Versions","Papers","Paper_ID",id,"Paper_Version_ID","Paper_Config_File_ID","Config_SHA256","PAPER");},list:list};
})();
function listDesignStudioForBrowser(){assertPrimaryUser_();return DesignService.list();}
function createBrandFromBrowser(p){assertPrimaryUser_();return DesignService.createBrand(p);}
function createTemplateFromBrowser(p){assertPrimaryUser_();return DesignService.createTemplate(p);}
function createPaperFromBrowser(p){assertPrimaryUser_();return DesignService.createPaper(p);}
function publishDesignVersionFromBrowser(kind,id){assertPrimaryUser_();if(kind==="BRAND")return DesignService.publishBrand(id);if(kind==="TEMPLATE")return DesignService.publishTemplate(id);if(kind==="PAPER")return DesignService.publishPaper(id);throw new Error("DESIGN_KIND_INVALID");}
function linkTemplateIdentityFromBrowser(p){assertPrimaryUser_();return DesignService.linkTemplateIdentity(p);}


// ===== domain/DesignStudio.js =====

/** Integrated Design Studio (DEV).
 * Brand identities + templates + domain-aware snapshot generation.
 * Uses Script Properties only. No new Sheets tables.
 * Reads EffectiveSpecificationResolver for real product data.
 * Populates approved images from existing Image_Links / Image_Assets.
 */
var DesignStudio = (function () {
  var BRAND_KEY = "DS_BRANDS";
  var TEMPLATE_KEY = "DS_TEMPLATES";
  var ISSUE_KEY = "DS_ISSUES";

  var BUILTIN_BRANDS = [
    {
      name: "Apple",
      identityType: "BUILTIN",
      isDefault: true,
      companyName: "Apple",
      primary: "#000000",
      secondary: "#555555",
      accent: "#0071E3",
      text: "#1D1D1F",
      background: "#FFFFFF",
      headerColor: "#000000",
      tableHeader: "#1D1D1F",
      border: "#E5E5E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "https://www.apple.com" }
    },
    {
      name: "6D",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "6D",
      primary: "#0A2540",
      secondary: "#1A6B8A",
      accent: "#00C2B8",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#0A2540",
      tableHeader: "#0A2540",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Industrial",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "Industrial Catalog",
      primary: "#173F5F",
      secondary: "#2D6B83",
      accent: "#E8A838",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#173F5F",
      tableHeader: "#173F5F",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "COMPANY",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Minimal",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "",
      primary: "#222222",
      secondary: "#666666",
      accent: "#222222",
      text: "#111111",
      background: "#FFFFFF",
      headerColor: "#222222",
      tableHeader: "#333333",
      border: "#CCCCCC",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "NONE",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.05,
      contact: { phone: "", email: "", website: "" }
    },
    {
      name: "Supplier",
      identityType: "BUILTIN",
      isDefault: false,
      companyName: "",
      primary: "#173F5F",
      secondary: "#2D6B83",
      accent: "#173F5F",
      text: "#17212B",
      background: "#FFFFFF",
      headerColor: "#173F5F",
      tableHeader: "#173F5F",
      border: "#D9E0E7",
      paperSize: "A4",
      orientation: "portrait",
      logoPreference: "SUPPLIER",
      fontRegularPath: "",
      fontBoldPath: "",
      watermarkText: "",
      watermarkOpacity: 0.08,
      contact: { phone: "", email: "", website: "" }
    }
  ];

  function load_(key) {
    var raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  function save_(key, data) {
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(data));
  }

  function ensureBuiltins_() {
    var brands = load_(BRAND_KEY);
    var changed = false;
    BUILTIN_BRANDS.forEach(function (b) {
      if (!brands.some(function (x) { return x.name === b.name; })) {
        brands.push(Object.assign({}, b, { updatedAt: new Date().toISOString() }));
        changed = true;
      }
    });
    if (changed) save_(BRAND_KEY, brands);
    return brands;
  }

  function listBrands() {
    return ensureBuiltins_();
  }

  function getBrand(name) {
    return ensureBuiltins_().find(function (b) { return b.name === name; }) || null;
  }

  function saveBrand(preset) {
    if (!preset || !preset.name) throw new Error("VALIDATION_REQUIRED: name");
    var brands = ensureBuiltins_();
    var idx = brands.findIndex(function (b) { return b.name === preset.name; });
    var record = {
      name: String(preset.name).slice(0, 80),
      identityType: "COMPANY",
      isDefault: false,
      companyName: String(preset.companyName || "").slice(0, 120),
      primary: preset.primary || "#173F5F",
      secondary: preset.secondary || "#2D6B83",
      accent: preset.accent || preset.primary || "#173F5F",
      text: preset.text || "#17212B",
      background: preset.background || "#FFFFFF",
      headerColor: preset.headerColor || preset.primary || "#173F5F",
      tableHeader: preset.tableHeader || preset.primary || "#173F5F",
      border: preset.border || "#D9E0E7",
      paperSize: preset.paperSize || "A4",
      orientation: preset.orientation || "portrait",
      logoPreference: preset.logoPreference || "COMPANY",
      fontRegularPath: String(preset.fontRegularPath || "").slice(0, 500),
      fontBoldPath: String(preset.fontBoldPath || "").slice(0, 500),
      watermarkText: String(preset.watermarkText || "").slice(0, 60),
      watermarkOpacity: Math.max(0.03, Math.min(0.35, Number(preset.watermarkOpacity) || 0.1)),
      contact: {
        phone: String(preset.phone || "").slice(0, 40),
        email: String(preset.email || "").slice(0, 80),
        website: String(preset.website || "").slice(0, 120)
      },
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) brands[idx] = record;
    else brands.push(record);
    save_(BRAND_KEY, brands);
    return record;
  }

  function listTemplates() {
    return load_(TEMPLATE_KEY);
  }

  function saveTemplate(t) {
    if (!t || !t.name) throw new Error("VALIDATION_REQUIRED: name");
    if (!["TECHNICAL_DATASHEET", "PRODUCT_CATALOG", "MASTER_CATALOG"].includes(t.documentType)) {
      throw new Error("DOCUMENT_TYPE_UNSUPPORTED");
    }
    var items = load_(TEMPLATE_KEY);
    var existing = items.find(function (x) { return x.name === t.name; });
    var version = existing ? (existing.version || 1) + 1 : 1;
    var history = existing && existing.history ? existing.history.slice() : [];
    if (existing && existing.status === "PUBLISHED") {
      history.push({ version: existing.version, snapshot: Object.assign({}, existing), archivedAt: new Date().toISOString() });
    }
    var record = {
      name: String(t.name).slice(0, 80),
      documentType: t.documentType,
      description: String(t.description || "").slice(0, 300),
      status: t.status || "DRAFT",
      includeIndex: t.includeIndex !== false,
      groupByFamily: !!t.groupByFamily,
      showProvenance: !!t.showProvenance,
      excludeUnpublished: !!t.excludeUnpublished,
      blockOnConflict: true,
      defaultBrandName: String(t.defaultBrandName || "Apple").slice(0, 80),
      version: version,
      history: history.slice(-5),
      updatedAt: new Date().toISOString()
    };
    if (existing) {
      var idx = items.findIndex(function (x) { return x.name === t.name; });
      items[idx] = record;
    } else {
      items.push(record);
    }
    save_(TEMPLATE_KEY, items);
    return record;
  }

  function publishTemplate(name) {
    var items = load_(TEMPLATE_KEY);
    var idx = items.findIndex(function (x) { return x.name === name; });
    if (idx < 0) throw new Error("TEMPLATE_NOT_FOUND");
    items[idx].status = "PUBLISHED";
    items[idx].publishedAt = new Date().toISOString();
    save_(TEMPLATE_KEY, items);
    return items[idx];
  }

  function copyTemplate(sourceName, newName) {
    var src = load_(TEMPLATE_KEY).find(function (x) { return x.name === sourceName; });
    if (!src) throw new Error("TEMPLATE_NOT_FOUND");
    return saveTemplate(Object.assign({}, src, { name: newName, status: "DRAFT" }));
  }

  function collectApprovedImages_(productId, variantId) {
    var images = [];
    function addLinks(targetType, targetId) {
      if (!targetId) return;
      var links = SheetsRepository.findAll("Image_Links", function (row) {
        return row.Target_Type === targetType && row.Target_ID === targetId &&
               row.Link_Status === "ACTIVE" && (row.Catalog_Approved || row.DataSheet_Approved);
      }) || [];
      links.forEach(function (link) {
        var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", link.Image_ID);
        if (!asset || asset.Lifecycle_Status !== "ACTIVE") return;
        images.push({
          image_id: asset.Image_ID,
          drive_file_id: asset.Original_File_ID,
          path: asset.Local_Path || "", // filled by a later Drive sync if needed
          display_width_mm: 70,
          is_primary: !!link.Is_Primary,
          catalog_approved: !!link.Catalog_Approved,
          datasheet_approved: !!link.DataSheet_Approved
        });
      });
    }
    addLinks("VARIANT", variantId);
    addLinks("PRODUCT", productId);
    return images;
  }

  function resolveItem_(productId, variantId) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND: " + productId);
    var company = SheetsRepository.getBy("Product_Company", "Product_ID", productId) || {};
    var variant = variantId ? SheetsRepository.getBy("Variants", "Variant_ID", variantId) : null;
    if (variantId && (!variant || variant.Product_ID !== productId)) {
      throw new Error("VARIANT_NOT_FOUND_OR_PRODUCT_MISMATCH: " + variantId);
    }
    var variantCompany = variantId
      ? (SheetsRepository.getBy("Variant_Company", "Variant_ID", variantId) || {})
      : {};
    var family = company.Product_Family_ID
      ? SheetsRepository.getBy("Product_Families", "Product_Family_ID", company.Product_Family_ID)
      : null;
    var resolved = EffectiveSpecificationResolver.resolveEffectiveSpecifications(productId, variantId || null);
    var specs = (resolved.source_specifications || []).map(function (s) {
      return {
        key: s.attribute_key,
        label: s.attribute_key,
        value: s.effective_value,
        unit: s.unit || "",
        provenance: s.provenance,
        scope: s.scope
      };
    });
    (resolved.company_attributes || []).forEach(function (a) {
      if (a.effective_value != null) {
        specs.push({
          key: a.attribute_id,
          label: a.attribute_id,
          value: a.effective_value,
          unit: "",
          provenance: a.mode || "COMPANY",
          scope: "ATTRIBUTE"
        });
      }
    });
    var productNameEn = company.Product_Name_EN || productId;
    var productNameAr = company.Product_Name_AR || "";
    var variantNameEn = variantCompany.Model_Name_EN || "";
    var variantNameAr = variantCompany.Model_Name_AR || "";
    return {
      productId: productId,
      variantId: variantId || null,
      product_name: productNameEn,
      product_name_ar: productNameAr,
      name: variantNameEn || productNameEn,
      name_ar: variantNameAr || productNameAr,
      description: company.Company_Description || "",
      family: family ? (family.Family_Name_EN || family.Family_Name_AR || "") : "",
      model_number: variantNameEn || variantNameAr || "",
      specifications: specs,
      images: collectApprovedImages_(productId, variantId),
      publishable: product.Lifecycle_Status === "ACTIVE",
      conflicts: resolved.conflicts || [],
      validation_errors: resolved.validation_errors || []
    };
  }

  function buildSnapshotFromDomain(config) {
    if (!config || !config.documentType) throw new Error("VALIDATION_REQUIRED: documentType");
    var productIds = config.productIds || [];
    if (!productIds.length) throw new Error("ISSUE_SCOPE_EMPTY");

    var brand = config.brandName ? getBrand(config.brandName) : getBrand("Apple");
    if (!brand) brand = BUILTIN_BRANDS[0];

    var template = config.templateName
      ? load_(TEMPLATE_KEY).find(function (t) { return t.name === config.templateName; })
      : null;

    var items = [];
    var allConflicts = [];
    var allValidationErrors = [];
    productIds.forEach(function (pid) {
      var variantId = config.variantMap && config.variantMap[pid] ? config.variantMap[pid] : null;
      var item = resolveItem_(pid, variantId);
      items.push(item);
      if (item.conflicts && item.conflicts.length) allConflicts = allConflicts.concat(item.conflicts);
      if (item.validation_errors && item.validation_errors.length) {
        allValidationErrors = allValidationErrors.concat(item.validation_errors);
      }
    });

    var isFinal = String(config.documentStatus || "ORIGINAL").toUpperCase() === "FINAL";
    if (isFinal && allValidationErrors.length) {
      throw new Error("SPECIFICATION_VALIDATION_ERRORS_BLOCK_FINAL: " + allValidationErrors.length);
    }
    if (isFinal && allConflicts.length) {
      throw new Error("CONFLICTS_BLOCK_FINAL_ISSUE: " + allConflicts.length);
    }

    var snap = {
      snapshot_version: "1",
      document_type: config.documentType,
      title: config.title || brand.companyName || "Industrial Catalog",
      subtitle: config.subtitle || "",
      items: items,
      brand: {
        palette: {
          primary: brand.primary,
          secondary: brand.secondary,
          accent: brand.accent,
          text: brand.text,
          header: brand.headerColor,
          tableHeader: brand.tableHeader,
          border: brand.border
        },
        fonts: {
          regular: brand.fontRegularPath || null,
          bold: brand.fontBoldPath || null
        },
        logoPreference: brand.logoPreference
      },
      paper: {
        page: {
          size: brand.paperSize || "A4",
          orientation: brand.orientation || "portrait",
          margins_mm: { top: 18, right: 12, bottom: 16, left: 12 }
        },
        background: { color: brand.background }
      },
      watermark: brand.watermarkText ? {
        text: brand.watermarkText,
        opacity: brand.watermarkOpacity,
        color: "#777777",
        rotation_degrees: -35
      } : {},
      export_profile: { output_class: "DIGITAL_PDF", minimum_dpi_warning: 150, minimum_dpi_block: 72 },
      contact: brand.contact || {},
      document_status: String(config.documentStatus || "ORIGINAL").toUpperCase(),
      block_on_conflict: true,
      revision: config.revision || "1.0",
      issue_date: config.issueDate || new Date().toISOString().slice(0, 10),
      show_provenance: template ? !!template.showProvenance : !!config.showProvenance,
      group_by_family: template ? !!template.groupByFamily : !!config.groupByFamily,
      include_index: template ? template.includeIndex !== false : config.includeIndex !== false,
      exclude_unpublished: template ? !!template.excludeUnpublished : !!config.excludeUnpublished,
      conflicts: allConflicts,
      generatedAt: new Date().toISOString(),
      brandName: brand.name,
      templateName: template ? template.name : null
    };

    var issues = load_(ISSUE_KEY);
    issues.unshift({
      id: Utilities.getUuid(),
      documentType: snap.document_type,
      title: snap.title,
      brandName: snap.brandName,
      templateName: snap.templateName,
      itemCount: items.length,
      conflictCount: allConflicts.length,
      createdAt: snap.generatedAt
    });
    save_(ISSUE_KEY, issues.slice(0, 50));

    return snap;
  }

  function listIssues() {
    return load_(ISSUE_KEY);
  }

  return {
    listBrands: listBrands,
    getBrand: getBrand,
    saveBrand: saveBrand,
    listTemplates: listTemplates,
    saveTemplate: saveTemplate,
    publishTemplate: publishTemplate,
    copyTemplate: copyTemplate,
    buildSnapshotFromDomain: buildSnapshotFromDomain,
    listIssues: listIssues
  };
})();

function listBrandsForBrowser() { assertPrimaryUser_(); return DesignStudio.listBrands(); }
function saveBrandFromBrowser(p) { assertPrimaryUser_(); return DesignStudio.saveBrand(p); }
function listTemplatesForBrowser() { assertPrimaryUser_(); return DesignStudio.listTemplates(); }
function saveTemplateFromBrowser(t) { assertPrimaryUser_(); return DesignStudio.saveTemplate(t); }
function publishTemplateFromBrowser(name) { assertPrimaryUser_(); return DesignStudio.publishTemplate(name); }
function copyTemplateFromBrowser(src, dest) { assertPrimaryUser_(); return DesignStudio.copyTemplate(src, dest); }
function buildSnapshotFromDomainForBrowser(config) { assertPrimaryUser_(); return DesignStudio.buildSnapshotFromDomain(config); }
function listIssuesForBrowser() { assertPrimaryUser_(); return DesignStudio.listIssues(); }


// ===== api/Api.js =====
var Api = (function () {
  function requestId_(body) {
    var supplied = body && typeof body.request_id === "string" ? body.request_id.trim() : "";
    return supplied && supplied.length <= 100 ? supplied : Utilities.getUuid();
  }
  function success_(requestId, data) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: true,
      data: data,
      error: null
    });
  }
  function failure_(requestId, code) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: false,
      data: null,
      error: { code: code, message: "Request could not be completed.", retryable: false }
    });
  }
  function safeCode_(err) {
    var message = String(err && err.message ? err.message : "");
    var match = message.match(/^([A-Z][A-Z0-9_]{2,80})/);
    return match ? match[1] : "REQUEST_FAILED";
  }
  function health(e) {
    var requestId = Utilities.getUuid();
    try {
      assertPrimaryUser_();
      var props = PropertiesService.getScriptProperties();
      return success_(requestId, {
        appVersion: APP.VERSION,
        schemaVersion: APP.SCHEMA_VERSION,
        environment: APP.ENVIRONMENT,
        spreadsheetConfigured: Boolean(props.getProperty("DEV_SPREADSHEET_ID")),
        schemaInitialized: props.getProperty("APP_SCHEMA_VERSION") === APP.SCHEMA_VERSION
      });
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  function post(e) {
    var body = {};
    var requestId = Utilities.getUuid();
    try {
      var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
      if (raw.length > 20000) return failure_(requestId, "REQUEST_TOO_LARGE");
      body = JSON.parse(raw);
      if (!body || Object.prototype.toString.call(body) !== "[object Object]") {
        return failure_(requestId, "INVALID_REQUEST");
      }
      requestId = requestId_(body);
      assertPrimaryUser_();
      if (body.protocol_version && body.protocol_version !== "1") {
        return failure_(requestId, "UNSUPPORTED_PROTOCOL_VERSION");
      }
      var p = body.payload || {};
      var actor = APP.ACTOR_ID;

      if (body.action === "catalog.register") {
        var payload = InputValidation.catalogPayload(p);
        var registered = CatalogService.register(payload);
        registered.workerDispatch = dispatchRegisteredCatalog_(registered);
        return success_(requestId, registered);
      }
      if (body.action === "staging.promote") {
        var promoPayload = InputValidation.promotionPayload(p);
        var promoted = StagingPromotion.promoteReviewedStaging({
          stagingSetFileId: promoPayload.stagingSetFileId,
          stagingSetSha256: promoPayload.stagingSetSha256,
          actor: actor
        });
        return success_(requestId, promoted);
      }
      if (body.action === "images.promote") {
        var imgPayload = InputValidation.imagesPromotePayload(p);
        var imgResult = ImagePromotion.promoteAcceptedImages({
          images: imgPayload.images,
          run_id: imgPayload.run_id,
          catalog_id: imgPayload.catalog_id,
          actor: actor
        });
        return success_(requestId, imgResult);
      }
      if (body.action === "images.intake") {
        var intakeResult = ImageReviewIntake.intake({
          imageManifestFileId: p.imageManifestFileId,
          imageManifestSha256: p.imageManifestSha256,
          driveManifestFileId: p.driveManifestFileId,
          driveManifestSha256: p.driveManifestSha256,
          actor: actor
        });
        return success_(requestId, intakeResult);
      }

      // Product domain — all validated at boundary
      if (body.action === "product.createCompanyRecord") {
        var pc = InputValidation.productCreatePayload(p);
        return success_(requestId, ProductService.create(Object.assign({ actor: actor }, pc)));
      }
      if (body.action === "product.getWorkspace") {
        var gw = InputValidation.idOnlyPayload(p, "productId");
        return success_(requestId, ProductService.getWorkspace(gw.productId));
      }
      if (body.action === "product.search") {
        var ps = InputValidation.productSearchPayload(p);
        return success_(requestId, { results: ProductService.search(ps.query) });
      }
      if (body.action === "product.updateCompanyFields") {
        var pu = InputValidation.productUpdatePayload(p);
        return success_(requestId, ProductService.updateCompany(pu.productId, pu, actor));
      }
      if (body.action === "product.archive" || body.action === "product.reactivate") {
        var pid = InputValidation.idOnlyPayload(p, "productId");
        var fn = body.action === "product.archive" ? ProductService.archive : ProductService.reactivate;
        return success_(requestId, fn(pid.productId, actor));
      }
      if (body.action === "family.create" || body.action === "family.updateParent" || body.action === "family.archive" || body.action === "family.reactivate") {
        var fp = InputValidation.familyPayload(p);
        if (body.action === "family.create") return success_(requestId, ProductFamilyService.create(fp.nameEn, fp.nameAr, fp.parentId, actor));
        if (body.action === "family.updateParent") return success_(requestId, ProductFamilyService.updateParent(fp.familyId, fp.newParentId, actor));
        if (body.action === "family.archive") return success_(requestId, ProductFamilyService.archive(fp.familyId, actor));
        return success_(requestId, ProductFamilyService.reactivate(fp.familyId, actor));
      }
      if (body.action === "variant.createCompanyRecord") {
        var vc = InputValidation.variantCreatePayload(p);
        return success_(requestId, VariantService.create(vc.productId, Object.assign({ actor: actor }, vc)));
      }
      if (body.action === "variant.updateCompanyFields") {
        var vu = InputValidation.variantUpdatePayload(p);
        return success_(requestId, VariantService.updateCompany(vu.variantId, vu, actor));
      }
      if (body.action === "variant.archive" || body.action === "variant.reactivate") {
        var vid = InputValidation.idOnlyPayload(p, "variantId");
        var vfn = body.action === "variant.archive" ? VariantService.archive : VariantService.reactivate;
        return success_(requestId, vfn(vid.variantId, actor));
      }
      if (body.action === "attribute.setProductValue") {
        var ap = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.setProductValue(ap.productId, ap.attributeId, ap.valueJson, actor));
      }
      if (body.action === "attribute.setVariantOverride") {
        var ao = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.setVariantOverride(ao.variantId, ao.attributeId, ao.mode, ao.valueJson, actor));
      }
      if (body.action === "attribute.clearVariantOverride") {
        var ac = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.clearVariantOverride(ac.variantId, ac.attributeId, actor));
      }
      if (body.action === "specification.appendChange") {
        var sc = InputValidation.specificationChangePayload(p);
        return success_(requestId, SpecificationService.appendDraft(Object.assign({ actor: actor }, sc)));
      }
      if (body.action === "specification.approveChange" || body.action === "specification.rejectChange") {
        var sid = InputValidation.idOnlyPayload(p, "changeId");
        var sfn = body.action === "specification.approveChange" ? SpecificationService.approve : SpecificationService.reject;
        return success_(requestId, sfn(sid.changeId, actor));
      }
      if (body.action === "specification.getEffective") {
        var se = InputValidation.effectiveSpecPayload(p);
        return success_(requestId, EffectiveSpecificationResolver.resolveEffectiveSpecifications(se.productId, se.variantId || null));
      }

      return failure_(requestId, "UNSUPPORTED_ACTION");
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  return { health: health, post: post };
})();

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action === "health") return Api.health(e);
  assertPrimaryUser_();
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Industrial Catalog Studio")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/** Browser upload endpoint. The deployed web app is restricted to the primary owner. */
function uploadCatalogFromBrowser(payload) {
  assertPrimaryUser_();
  var upload = InputValidation.uploadMetadata(payload);
  var name = upload.fileName;
  var bytesEncoded = upload.base64;
  var bytesLength = bytesEncoded.length;
  if (bytesLength > 16777216) throw new Error("INVALID_BASE64_OR_FILE_TOO_LARGE");
  var bytes = Utilities.base64Decode(bytesEncoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("FILE_SIZE_OUT_OF_RANGE");
  var signature = bytes.slice(0, 5).map(function (byte) { return String.fromCharCode(byte < 0 ? byte + 256 : byte); }).join("");
  if (signature !== "%PDF-") throw new Error("INVALID_PDF_SIGNATURE");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_CATALOG_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_CATALOG_FOLDER_ID");
  var blob = Utilities.newBlob(bytes, "application/pdf", name);
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  var catalogPayload = InputValidation.catalogPayload({
    driveFileId: file.getId(),
    supplierName: upload.supplierName,
    catalogTitle: upload.catalogTitle,
    catalogRevision: upload.catalogRevision
  });
  var registered = CatalogService.register(catalogPayload);
  var workerDispatch = dispatchRegisteredCatalog_(registered);
  return {
    catalogId: registered.catalogId,
    runId: registered.runId,
    fileName: file.getName(),
    sha256: registered.sha256,
    status: registered.status,
    idempotentReplay: registered.idempotentReplay,
    workerDispatch: workerDispatch
  };
}

/** Owner-only data endpoint called by the HtmlService dashboard. */
function getCatalogDashboard() {
  assertPrimaryUser_();
  var catalogs = SheetsRepository.listRecent("Catalogs", 30);
  var runs = SheetsRepository.listRecent("Run_Log", 60);
  var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID")).getSheetByName("Catalogs");
  return { catalogs: catalogs, runs: runs, totalCount: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0 };
}

/** Run manually from the Apps Script editor after DEV properties are configured. */
function initializeDevSchema() {
  assertPrimaryUser_();
  return SheetsRepository.initialize();
}

/** Owner-only endpoint for promoting a reviewed staging set from Drive. */
function promoteStagingFromBrowser(payload) {
  assertPrimaryUser_();
  var validated = InputValidation.promotionPayload(payload || {});
  return StagingPromotion.promoteReviewedStaging({
    stagingSetFileId: validated.stagingSetFileId,
    stagingSetSha256: validated.stagingSetSha256,
    actor: APP.ACTOR_ID
  });
}

/** Owner-only endpoint for promoting accepted images. */
function promoteImagesFromBrowser(payload) {
  assertPrimaryUser_();
  var validated = InputValidation.imagesPromotePayload(payload || {});
  return ImagePromotion.promoteAcceptedImages({
    images: validated.images,
    run_id: validated.run_id,
    catalog_id: validated.catalog_id,
    actor: APP.ACTOR_ID
  });
}

/** Owner-only endpoint for image review intake. */
function intakeImagesFromBrowser(payload) {
  assertPrimaryUser_();
  return ImageReviewIntake.intake({
    imageManifestFileId: payload.imageManifestFileId,
    imageManifestSha256: payload.imageManifestSha256,
    driveManifestFileId: payload.driveManifestFileId,
    driveManifestSha256: payload.driveManifestSha256,
    actor: APP.ACTOR_ID
  });
}

function doPost(e) {
  return Api.post(e);
}
