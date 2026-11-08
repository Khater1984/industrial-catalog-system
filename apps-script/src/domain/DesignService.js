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
  if(description!==undefined)row.Description=text_(description,1000,"DESIGN_DESCRIPTION",false);
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
  SheetsRepository.updateBy(table,idField,id,{Design_Config_File_ID:table==="Brand_Versions"?cfg.file_id:undefined});
  if(table==="Brand_Versions")SheetsRepository.updateBy(table,idField,id,{Config_SHA256:cfg.sha256,Change_Notes:text_(notes,1500,"DESIGN_CHANGE_NOTES",false)});
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
 function linkTemplateIdentity(p){
  var t=one_("Templates","Template_ID",p.templateId),b=one_("Brands","Brand_ID",p.brandId);if(!t||!b)throw new Error("DESIGN_IDENTITY_LINK_TARGET_MISSING");
  var active=rows_("Template_Identity_Links").filter(function(x){return x.Template_ID===p.templateId&&x.Brand_ID===p.brandId&&x.Status==="ACTIVE";})[0];
  if(active){if(p.isDefault&&!active.Is_Default)SheetsRepository.updateBy("Template_Identity_Links","Template_Identity_Link_ID",active.Template_Identity_Link_ID,{Is_Default:true});return active;}
  if(p.isDefault)rows_("Template_Identity_Links").filter(function(x){return x.Template_ID===p.templateId&&x.Status==="ACTIVE"&&x.Is_Default;}).forEach(function(x){SheetsRepository.updateBy("Template_Identity_Links","Template_Identity_Link_ID",x.Template_Identity_Link_ID,{Is_Default:false});});
  var link={Template_Identity_Link_ID:id_("til"),Template_ID:p.templateId,Brand_ID:p.brandId,Is_Default:Boolean(p.isDefault),Status:"ACTIVE",Created_At:now_()};
  SheetsRepository.append("Template_Identity_Links",link);audit_("LINK","TEMPLATE_IDENTITY",link.Template_Identity_Link_ID,null,link);return link;
 }
 function list(){return {assets:rows_("Design_Assets"),brands:rows_("Brands"),brandVersions:rows_("Brand_Versions"),papers:rows_("Papers"),paperVersions:rows_("Paper_Versions"),templates:rows_("Templates"),templateVersions:rows_("Template_Versions"),templateIdentityLinks:rows_("Template_Identity_Links")};}
 return {registerAsset:registerAsset,createBrand:createBrand,createTemplate:createTemplate,createPaper:createPaper,updateBrandDraft:function(id,c,n){return updateDraft_("Brand_Versions","Brand_Version_ID",id,c,n);},updateTemplateDraft:function(id,c,n){return updateDraft_("Template_Versions","Template_Version_ID",id,c,n);},updatePaperDraft:function(id,c){return updateDraft_("Paper_Versions","Paper_Version_ID",id,c,"");},publishBrand:function(id){return publish_("Brand_Versions","Brand_Version_ID",id,"Design_Config_File_ID","Config_SHA256");},publishTemplate:function(id){return publish_("Template_Versions","Template_Version_ID",id,"Template_Config_File_ID","Config_SHA256");},publishPaper:function(id){return publish_("Paper_Versions","Paper_Version_ID",id,"Paper_Config_File_ID","Config_SHA256");},linkTemplateIdentity:linkTemplateIdentity,list:list};
})();
function listDesignStudioForBrowser(){assertPrimaryUser_();return DesignService.list();}
function createBrandFromBrowser(p){assertPrimaryUser_();return DesignService.createBrand(p);}
function createTemplateFromBrowser(p){assertPrimaryUser_();return DesignService.createTemplate(p);}
function createPaperFromBrowser(p){assertPrimaryUser_();return DesignService.createPaper(p);}
function publishDesignVersionFromBrowser(kind,id){assertPrimaryUser_();if(kind==="BRAND")return DesignService.publishBrand(id);if(kind==="TEMPLATE")return DesignService.publishTemplate(id);if(kind==="PAPER")return DesignService.publishPaper(id);throw new Error("DESIGN_KIND_INVALID");}
function linkTemplateIdentityFromBrowser(p){assertPrimaryUser_();return DesignService.linkTemplateIdentity(p);}
