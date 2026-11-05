/** BEGIN SOURCE: src/config/Schema.js */
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
/** END SOURCE: src/config/Schema.js */

/** BEGIN SOURCE: src/validation/InputValidation.js */
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
/** END SOURCE: src/validation/InputValidation.js */

/** BEGIN SOURCE: src/security/Auth.js */
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
/** END SOURCE: src/security/Auth.js */

/** BEGIN SOURCE: src/repositories/SheetsRepository.js */
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
/** END SOURCE: src/repositories/SheetsRepository.js */

/** BEGIN SOURCE: src/domain/CatalogService.js */
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
/** END SOURCE: src/domain/CatalogService.js */

/** BEGIN SOURCE: src/domain/Ingest.js */
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
/** END SOURCE: src/domain/Ingest.js */

/** BEGIN SOURCE: src/domain/WorkerIntegration.js */
/** Cloud Run dispatch plus owner-executed Drive result polling. */
var WorkerIntegration = (function () {
  var CONTRACT_VERSION = "1";
  function property_(name) {
    return (PropertiesService.getScriptProperties().getProperty(name) || "").trim();
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
    var endpoint = property_("DEV_WORKER_ENDPOINT");
    if (!endpoint) return { configured: false, accepted: false, reason: "WORKER_ENDPOINT_NOT_CONFIGURED" };
    if (endpoint.indexOf("https://") !== 0) throw new Error("WORKER_ENDPOINT_HTTPS_REQUIRED");
    var token = property_("DEV_WORKER_SHARED_TOKEN");
    if (!token) throw new Error("WORKER_TOKEN_NOT_CONFIGURED");

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", catalogId);
      if (!run || !catalog || run.Catalog_ID !== catalogId) throw new Error("RUN_CATALOG_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        throw new Error("TERMINAL_RUN_CANNOT_DISPATCH");
      }
      var folder = getRunFolder_(runId);
      var job = {
        contract_version: CONTRACT_VERSION, manifest_version: 1,
        run_id: runId, logical_job_id: run.Logical_Job_ID,
        catalog_id: catalogId, source_pdf_file_id: catalog.Source_File_ID,
        source_sha256: catalog.SHA256, attempt_number: Number(run.Attempt_Number) || 1,
        parent_run_id: run.Parent_Run_ID || null, retry_reason: run.Retry_Reason || null,
        extraction_profile: "embedded-text-v1", run_folder_id: folder.getId()
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

      var payload = { contract_version: CONTRACT_VERSION, run_id: runId, job_file_id: jobFile.getId() };
      var lastError = "";
      for (var attempt = 1; attempt <= 4; attempt++) {
        try {
          var response = UrlFetchApp.fetch(endpoint, {
            method: "post", contentType: "application/json",
            headers: {
              Authorization: "Bearer " + token,
              "Idempotency-Key": runId,
              "Content-Type": "application/json"
            },
            payload: JSON.stringify(payload), muteHttpExceptions: true
          });
          var code = response.getResponseCode(), parsed = null;
          try { parsed = JSON.parse(response.getContentText()); } catch (ignore) {}
          if (code >= 200 && code < 300 && parsed && parsed.accepted === true && parsed.run_id === runId) {
            return { configured: true, accepted: true, run_id: runId, task: parsed.task || "" };
          }
          lastError = "HTTP_" + code;
          if (code >= 400 && code < 500 && code !== 408 && code !== 429) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
              Run_Status: "FAILED", Current_Step: "DISPATCH_REJECTED",
              Finished_At: new Date().toISOString(), Worker_Lease_ID: "", Lease_Expires_At: "",
              Error_Code: "WORKER_REJECTED", Error_Summary: "Worker rejected dispatch (" + code + ")."
            });
            throw new Error("WORKER_REJECTED: " + code);
          }
        } catch (err) {
          lastError = String(err && err.message ? err.message : "NETWORK_ERROR").slice(0, 120);
          if (lastError.indexOf("WORKER_REJECTED") === 0) throw err;
        }
        if (attempt < 4) Utilities.sleep(1000 * Math.pow(2, attempt - 1));
      }
      // A response can be lost after Cloud Tasks accepted the deterministic task.
      // Keep the same Run_ID; Cloud Tasks task naming makes redispatch idempotent.
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RETRY_PENDING", Current_Step: "DISPATCH_UNCONFIRMED",
        Error_Code: "WORKER_DISPATCH_UNCONFIRMED",
        Error_Summary: "Dispatch response was not confirmed; retry with the same Run_ID. " + lastError
      });
      return { configured: true, accepted: false, retryable: true, run_id: runId };
    } finally {
      lock.releaseLock();
    }
  }
  function processCompletedRuns() {
    var runs = SheetsRepository.listAll("Run_Log"), processed = [], errors = [];
    runs.forEach(function (run) {
      if (["RUNNING", "RETRY_PENDING"].indexOf(run.Run_Status) < 0 || !run.Input_Manifest_File_ID) return;
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
        processed.push(result);
      } catch (err) {
        var code = String(err && err.message ? err.message : "INGEST_FAILED").slice(0, 120);
        if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) < 0) {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Error_Code: "RESULT_INGEST_REJECTED",
              Error_Summary: code
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
    if (code === "WORKER_REJECTED") registered.status = "FAILED";
    return { configured: true, accepted: false, retryable: code !== "WORKER_REJECTED", run_id: registered.runId,
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
/** END SOURCE: src/domain/WorkerIntegration.js */

/** BEGIN SOURCE: src/api/Api.js */
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
      if (body.action === "catalog.register") {
        var payload = InputValidation.catalogPayload(body.payload || {});
        var registered = CatalogService.register(payload);
        registered.workerDispatch = dispatchRegisteredCatalog_(registered);
        return success_(requestId, registered);
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

function doPost(e) {
  return Api.post(e);
}
/** END SOURCE: src/api/Api.js */
