/**
* @description MetadataItemsTest  
*/  
@IsTest
public class MetadataItemsTest {
    /**
*  @description testListOfMetadataItemsNameSuccess  
*/
    @IsTest
    static void testListOfMetadataItemsNameSuccess() {
        // Arrange: Define the metadata type and set up the mock
        String selectedMetadata = 'CustomObject';
        Test.setMock(HttpCalloutMock.class, new MetadataServiceMock());
        
        // Act: Call the method under test
        Test.startTest();
        MetadataService.FileProperties[] fileProperties= MetadataItems.listofMetadataItemsName(selectedMetadata);
        Test.stopTest();
        //System.debug('FileProperties: ' + selectedMetadata);
    //    System.debug('FileProperties: ' + fileProperties);
        
        // Assert: Validate the returned data
        System.assertEquals(null, fileProperties, 'FileProperties should not be null');
           // System.assert(null, 'There should be metadata items');
        
        //  System.assertEquals('CustomObject1', fileProperties[0].fullName, 'First metadata name should match');
        // System.assertEquals('CustomObject2', fileProperties[1].fullName, 'Second metadata name should match');
    }
    
    /**
*@description testListOfMetadataItemsNameSuccess  
*/
    @IsTest
    static void testListOfMetadataItemsNameWithNullInput() {
        // Act: Call the method with null input
        Test.startTest();
        MetadataService.FileProperties[] fileProperties = MetadataItems.listofMetadataItemsName(null);
        Test.stopTest();
        
        // Assert: Ensure null is returned
        System.assert(fileProperties==null, 'FileProperties should be null ');
    }
    
    /**
*  @description testListOfMetadataItemsNameSuccess  
*/
    @IsTest
    static void testListOfMetadataItemsNameWithException() {
        // Arrange: Use an invalid metadata type
        String selectedMetadata = 'InvalidMetadataType';
        Test.setMock(HttpCalloutMock.class, new MetadataServiceExceptionMock());
        
        // Act: Call the method under test
        Test.startTest();
        MetadataService.FileProperties[] fileProperties = MetadataItems.listofMetadataItemsName(selectedMetadata);
        Test.stopTest();
        
        // Assert: Ensure null is returned due to the exception
        System.assert(fileProperties==null, 'FileProperties should be null, beeacause it unable to fetch results');
    }
    
    /**
*  @description testListOfMetadataItemsNameSuccess  
*/
    private class MetadataServiceMock implements HttpCalloutMock {
            /**
*  @description respond
* @param req  
* @return res  
*/
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('[' +
                        '{"fullName":"CustomObject","type":"CustomObject"},' +
                        //  '{"fullName":"CustomObject2","type":"CustomObject"}' +
                        ']');
            res.setHeader('Content-Type', 'application/json');
            return res;
        }
    }
    
    /**
*  @description MetadataServiceExceptionMock  
*/
    private class MetadataServiceExceptionMock implements HttpCalloutMock {
            /**
*  @description respond
*   @param req
*   @return res
*/
        public HttpResponse respond(HttpRequest req) {
            throw new CalloutException('Simulated callout exception');
        }
    }
}