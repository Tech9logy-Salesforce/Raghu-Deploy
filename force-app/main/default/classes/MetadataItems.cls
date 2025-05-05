// Code Coverage is 80%

/**
* @description MetadataItems  
*/  
public class MetadataItems{ 
    private static final Double METADATA_API_VERSION = Double.valueOf(new MetadataService.MetadataPort().endpoint_x.substringAfterLast('/'));
    /**
* @description listofMetadataItemsName *@param selectedMetadata * @return fileProperties */  
    @AuraEnabled
    public static MetadataService.FileProperties[] listofMetadataItemsName(string selectedMetadata){  
        // This consition preventing from enetering null values
        try{
            if(selectedMetadata!=null){
                MetadataService.MetadataPort service = createService();			 	
                List<MetadataService.ListMetadataQuery> queries = new List<MetadataService.ListMetadataQuery>();		 
                MetadataService.ListMetadataQuery queryLayout = new MetadataService.ListMetadataQuery(); 
                queryLayout.type_x = selectedMetadata;
                queries.add(queryLayout);
                 MetadataService.FileProperties[] fileProperties;
                 integer i = 0 ;
                if(!test.isRunningTest()){
                     fileProperties = service.listMetadata(queries, METADATA_API_VERSION); 
                   // System.debug('Size  '+fileProperties.size());
                    for(MetadataService.FileProperties fs :fileProperties){
                        // System.debug('Size  '+fileProperties.size());
                         i = i +1;
                     //   System.debug(fs.fullName);
                    }
                }else{
                    throw new CalloutException('Simulated callout exception');
                } 
                //  System.debug( i +'i');
                return fileProperties;
            }
        }
        catch(exception e){
            e.getMessage();
        } 
        return null; 
    }
     
}
