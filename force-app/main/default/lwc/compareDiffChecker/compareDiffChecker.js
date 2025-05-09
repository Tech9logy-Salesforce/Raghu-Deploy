import { LightningElement, track, api, wire } from 'lwc';
import retrive from '@salesforce/apex/BackupApexController.retrieve';
import checkStatus from '@salesforce/apex/BackupApexController.checkRetrieveStatus';
import listofMetadata from '@salesforce/apex/BackupApexController.listofMetadata';
import retrieveViaSelectedMetadata from '@salesforce/apex/BackupApexController.retrieveViaSelectedMetadata';

// For Connected org 
import retrive2 from '@salesforce/apex/GetDataFromConnectedOrg.retrieve';
import checkStatus2 from '@salesforce/apex/GetDataFromConnectedOrg.checkRetrieveStatus';
import listofMetadata2 from '@salesforce/apex/GetDataFromConnectedOrg.listofMetadata';
import retrieveViaSelectedMetadata2 from '@salesforce/apex/GetDataFromConnectedOrg.retrieveViaSelectedMetadata';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import JSZIP from '@salesforce/resourceUrl/JsZip'; // Assuming JSZip is uploaded as a static resource
import deepDiffJsLibrary from '@salesforce/resourceUrl/deepDiffJsLibrary'; // Reference to Static Resource 

/* For Email Template */
import getEmailTemplateNames from '@salesforce/apex/CompareChangesMigSOApexController.getEmailTemplateNames';
import getEmailTemplatesBody from '@salesforce/apex/CompareChangesMigSOApexController.getEmailTemplatesBody';
import getEmailTemplateFromConnectedOrg from '@salesforce/apex/CompareChangesMigSOApexController.getEmailTemplateFromConnectedOrg';

import XML2JSON from '@salesforce/resourceUrl/xml2json';
// import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class CompareDiffChecker extends LightningElement {


    @track isShowResetBtn = false;
    @track isShowCompareBtn = false;

    selectAllLwc = false;
    selectAllAura = false;
    isxml2jsonLibraryLoaded = false;

    // Variable Declaration Starts
    isShowSideDropdown = false;
    @track isShowLwcModel = false;
    @track selectedFiles = {
        css: false,
        html: false,
        js: false,
        apex: false,
        design: false,
        auraRenderer: false,
        auraComponent: false,
        auraHelper: false,
        auraController: false
    };


    @track orgCredentials = ['devloperaccount@gmail.com', 'siddheshashtankar9834tt@gmail.com'];

    @track showDropdown = false;
    @track showDropdown2 = false;

    @track showEmailDropdown = false;
    @track showEmailDropdown2 = false;

    @track comparisonResult = [];     // Array to hold comparison results 

    @track originalLines = [];
    @track modifiedLines = [];


    @track dataContent = '';
    @track dataContent2 = '';

    @track value = '';
    @track value2 = '';


    @track clickedMetadataItems = [];
    @track selectedField = [];
    @track searchKey = '';
    @track filterList = [];
    @track optionSelect = '';


    @track clickedMetadataItems2 = [];
    @track selectedField2 = [];
    @track searchKey2 = '';
    @track filterList2 = [];
    @track optionSelect2 = '';

    @track isShowTable = false;
    isLoading = false;
    isShowComparision = false;
    // Variable Declaration Ends



    get options() {
        return [{
            label: 'Apex Class',
            value: 'ApexClass'
        },
        {
            label: 'Apex Trigger',
            value: 'ApexTrigger'
        },
        {
            label: 'Lightning Web Component',
            value: 'LightningComponentBundle'
        },
        {
            label: 'Aura Component',
            value: 'AuraDefinitionBundle'
        },
        {
            label: 'VisualForce page',
            value: 'ApexPage'
        },
        {
            label: 'VisualForce Component',
            value: 'ApexComponent'
        },
        {
            label: 'Lightning Page',
            value: 'FlexiPage'
        },
        {
            label: 'Email Template',
            value: 'EmailTemplate'
        },
        {
            label: 'Validation Rule',
            value: 'ValidationRule'
        },
            // {
            //     label: 'Flows',
            //     value: 'Flow'
            // },
        ];
    }



    // Loading the JSZip library
    connectedCallback() {
        if (!this.jszipJsLoaded) {
            loadScript(this, JSZIP)
                .then(() => {
                    this.jszipJsLoaded = true;
                    console.log("JSZip Library Loaded");

                    // Now load deepDiffJsLibrary after JSZip (if dependency exists)
                    return loadScript(this, deepDiffJsLibrary);
                })
                .then(() => {
                    this.diffJsLoaded = true;
                    console.log("Diff.js library loaded.");
                })
                .catch(error => {
                    console.error("Error loading libraries:", error);
                });
        }
       
    }

    // Load the static resource only once in renderedCallback
    renderedCallback() {
        if (this.isxml2jsonLibraryLoaded) {
            return;
        }
        loadScript(this, XML2JSON)
            .then(() => {
                this.isxml2jsonLibraryLoaded = true;
                console.log('XML2JSON library loaded successfully');
            })
            .catch(error => {
                console.error('Error loading XML2JSON', error);
            });
    }




    @track selectedOrg1 = '';
    @track selectedOrg2 = '';

    get orgOptions() {
        return this.orgCredentials.map(email => ({ label: email, value: email }));
    }

    get filteredOrgOptions() {
        return this.orgCredentials
            .filter(email => email !== this.selectedOrg1)
            .map(email => ({ label: email, value: email }));
    }

    handleOrg1Change(event) {
        this.selectedOrg1 = event.detail.value;
        this.selectedOrg2 = ''; // Reset second dropdown selection
        this.isShowTable = true;
    }

    handleOrg2Change(event) {
        this.selectedOrg2 = event.detail.value;
    }

    @track metadataLabel = '';
    @track metadataLabel2 = '';
    handleChange(event) {
        this.resetCodeHandler()
        const selectedValue = event.detail.value;
        this.value = selectedValue;
        // look up the matching option object in your options list
        const selectedOption = this.options.find(opt => opt.value === selectedValue);

        // pull out its label (or default to an empty string if somehow not found)
        // this.metadataLabel = `Choose ${selectedOption.label} from Target org`;
        console.log(this.metadataLabel);
        this.metadataLabel = `Select ${selectedOption.label} of Org 1`;
        this.metadataLabel2 = `Select ${selectedOption.label} of Org 2`;

        // now you can use metadataLabel wherever you need it
        console.log('Selected value:', selectedValue);
        console.log('Selected label:', this.metadataLabel);


        // if (selectedOption == 'LightningComponentBundle' || selectedOption == 'AuraDefinitionBundle') {

        // }

        this.dataContent = '';
        this.dataContent2 = '';
        this.optionSelect = '';
        this.optionSelect2 = '';

        // this.metadataLabel = event.detail.value;
        // console.log(this.value);
        this.isShowTable = true;
        this.isShowComparision = false;
        this.isLoading = true;

        this.showEmailDropdown = false;
        this.showDropdown = false;
        this.showEmailDropdown2 = false;
        this.showDropdown2 = false;
        this.handleClickMetadataItems(this.value);
    }


    handleClickMetadataItems(selectedValue) {
        this.clickedMetadataItems = [];
        this.filterList = [];
        this.isShowTable = true;
        if (this.value == 'EmailTemplate') {
            getEmailTemplateNames({ selectedMetadata: selectedValue })
                .then(result => {
                    console.log(`Fetch getEmailTemplateNames result = ${JSON.stringify(result)}`);
                    this.clickedMetadataItems = result;
                    this.filterList = result;
                    console.log(`clickedMetadataItems = ${JSON.stringify(this.clickedMetadataItems)}`);
                    console.log(`filterList = ${JSON.stringify(this.filterList)}`);
                    this.isLoading = false;
                })
                .catch(error => {
                    console.log(`Error in getlistMetadataItems() => ${JSON.stringify(error)}`);
                    this.isLoading = false;
                })
        }
        else {
            listofMetadata({ selectedMetadata: selectedValue })
                .then(result => {
                    console.log(`result ==> ${JSON.stringify(result)}`);
                    console.log(`type of ==> ${typeof result}`);
                    this.clickedMetadataItems = result;
                    this.filterList = result;
                    this.isLoading = false;
                })
                .catch(error => {
                    console.error("Error fetching listofMetadata:", error);
                    this.isLoading = false;
                });
            listofMetadata2({ selectedMetadata: selectedValue })
                .then(result => {
                    console.log(`result2 ==> ${JSON.stringify(result)}`);
                    console.log(`type of2 ==> ${typeof result}`);
                    this.clickedMetadataItems2 = result;
                    this.filterList2 = result;
                    this.isLoading = false;
                })
                .catch(error => {
                    console.error("Error fetching listofMetadata2:", error);
                    this.isLoading = false;
                });
        }
    }

    // org1 Search Boxes : Starts 
    handleClick(event) {
        if (this.value == 'EmailTemplate') {
            this.showEmailDropdown = true;
        }
        else {
            this.showDropdown = true;
        }
    }
    handleSearchChange(event) {
        this.isShowSideDropdown = false;
        this.optionSelect2 = '';
        console.log(`this.searchKey ==>${this.searchKey}`);
        this.isShowComparision = false;
        this.searchKey = event.target.value;
        if (this.value == 'EmailTemplate') {
            this.filterList = this.clickedMetadataItems?.filter(item =>
                typeof item === 'string' && item.toLowerCase().includes(this.searchKey)
            );
            console.log(`EmailTemplate this.filterList ==> ${JSON.stringify(this.filterList)}`);
            this.showEmailDropdown = true;
            this.showDropdown = false;
        }
        else {
            this.filterList = this.clickedMetadataItems?.filter(item =>
                item.fullName?.toLowerCase().includes(event.target.value.toLowerCase()
                ));
            console.log(`else this.filterList ==> ${JSON.stringify(this.filterList)}`);
            this.showDropdown = true;
            this.showEmailDropdown = false;
        }
       
    }

    // Handle selection from the dropdown
    async handleOptionSelect(event) {
        this.isLoading = true;

        this.filesOrg1 = [];
        this.filesOrg2 = [];

        this.selectedFiles = {};

        this.isShowComparision = false;
        this.isShowTable = true;
        this.showDropdown = false ;
        this.isShowSideDropdown = true;
        this.dataContent = '';
        // this.dataContent2 = '';
        this.selectedField = [];
        //    selectedMetadataRetrieveAgain(); 
        console.log(`event ===> ${event}`);
        this.optionSelect = event.currentTarget.dataset.value;
        let dataName = event.currentTarget.dataset.value
        // console.log(`event.currentTarget.dataset.value ==> ${event.currentTarget.dataset.value}`);
        // console.log(`Json dataName ==> ${JSON.stringify(dataName)}`);
        console.log(`dataName fullName ==> ${dataName}`);
        this.selectedField.push(dataName);

        if (this.value == 'EmailTemplate') {
            this.showEmailDropdown = false;
            getEmailTemplatesBody({ 'emailTemplateName': dataName })
                .then(result => {
                    console.log('getApexClassBody Result ==>', result);
                    this.dataContent = result;
                    this.isLoading = false;
                })
                .catch(error => {
                    console.log(`Error in getEmailTemplatesBody => ${JSON.stringify(error)}`);
                    this.isLoading = false;
                })
        }
        else {
            if (this.value!= 'LightningComponentBundle' && this.value != 'AuraDefinitionBundle') {
                this.showDropdown = false;
                console.log(`this.selectedField ==> ${JSON.stringify(this.selectedField)}`);
                const metaRetrieveId = await this.selectedMetadataRetrieveAgain();
                if (metaRetrieveId) {
                    const checkSts = await this.checkRetrieve(metaRetrieveId);
                    // if (checkSts) {
                    //     // // this.ShowToast('Success', 'Data Loaded successfully', 'success', 'dismissable');
                    //     // this.isLoading = false;
                    // }
                }
            }
        }
        this.isLoading=false;
    }


    async selectedMetadataRetrieveAgain() {
        try {
            const retrObj = await
                ({
                    metadataItems: this.selectedField,
                    typeClass: this.value,
                });
            if (!retrObj) {
                return await this.selectedMetadataRetrieveAgain();
            } else {
                return retrObj;
            }
        } catch (error) {
            console.log(`🎶 selectedMetadataRetrieveAgain error ==> ${selectedMetadataRetrieveAgain}`);
        }

    }


    async checkRetrieve(metaRetrieveId) {
        const retrieveObj = await checkStatus({
            asyncProcessId: metaRetrieveId,
            includeZip: true
        });
        console.log("Id " + retrieveObj.id);
        if (retrieveObj && retrieveObj.zipFile) {
            console.log(`retrieveObj ==>${JSON.stringify(retrieveObj)}`);
            const zipBase64 = retrieveObj.zipFile;
           
            this.unzipBackup(zipBase64);

            return true;
        } else {
            return await this.checkRetrieve(metaRetrieveId);
        }
    }

    @track filesOrg1 = []; // [{ fileName, content }]
    @track filesOrg2 = [];

   

    unzipBackup(base64Zip) {
        if (!this.jszipJsLoaded) {
            console.error("JSZip is not loaded yet.");
            return;
        }

        const byteCharacters = atob(base64Zip);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }

        JSZip.loadAsync(byteArray)
            .then(zip => {
                console.log("Zip Loaded Successfully");

                let fileEntries = [];

                zip.forEach((relativePath, zipEntry) => {
                    const fileName = relativePath.split('/').pop();
                    const fileExtension = fileName.split('.').pop().toLowerCase();

                    // Skip XML files
                    if (fileExtension === 'xml') {
                        console.log(`Skipping XML file: ${fileName}`);
                        return;
                    }

                    fileEntries.push({ relativePath, zipEntry, fileName, fileExtension });
                });

                // Define order for sorting (CSS → HTML → JS → Other metadata)
                const orderPriority = {
                    css: 1,
                    html: 2,
                    js: 3,
                    apex: 4,   // Apex classes & triggers
                    aura: 5,   // Aura components
                    other: 10  // Other metadata types
                };

                fileEntries.sort((a, b) => {
                    let typeA = orderPriority[a.fileExtension] || orderPriority.other;
                    let typeB = orderPriority[b.fileExtension] || orderPriority.other;
                    return typeA - typeB;
                });

                let dataContent = '';
                let readPromises = [];

                fileEntries.forEach(({ zipEntry, fileName, fileExtension }) => {
                    // Only include selected file types from popup
                    if (
                        this.value === 'LightningComponentBundle' &&
                        !(
                            (this.selectedFiles.html && fileExtension === 'html') ||
                            (this.selectedFiles.css && fileExtension === 'css') ||
                            (this.selectedFiles.js && fileExtension === 'js')
                        )
                    ) {
                        return; // Skip unselected files in LWC
                    }
                    if (this.value === 'AuraDefinitionBundle') {
                        if (
                            (!this.selectedFiles.auraComponent && fileExtension === 'cmp') ||
                            (!this.selectedFiles.auraHelper && fileName.includes('Helper.js')) ||
                            (!this.selectedFiles.auraController && fileName.includes('Controller.js')) ||
                            (!this.selectedFiles.auraRenderer && fileName.includes('Renderer.js')) ||
                            (!this.selectedFiles.design && fileExtension === 'design') ||
                            (!this.selectedFiles.css && fileExtension === 'css')
                        ) {
                            return;
                        }
                    }

                    console.log(`✅ Including file: ${fileName}`);
                    readPromises.push(
                        zipEntry.async('string').then(content => {
                            dataContent += `// ***** ${fileName}  ==> \n${content}`;
                            if (this.value == 'LightningComponentBundle' || this.value == 'AuraDefinitionBundle') {
                                this.filesOrg1.push({ fileName, content, fileExtension });
                                console.log(`this.filesOrg1 ==> ${JSON.stringify(this.filesOrg1)}`);
                            }

                        })
                    );
                });

                console.log("Total Files Selected: ", readPromises.length);

                if (readPromises.length === 0) {
                    console.warn("🚨 No files matched the selection. dataContent will be empty.");
                }

                return Promise.all(readPromises).then(() => {
                    this.dataContent = dataContent;
                    console.log(`✅ Final this.dataContent:\n ${this.dataContent}`);
                    if (this.value == 'Flow') {
                        let checkFlag = this.convertXmlToJson(this.dataContent);
                        if (checkFlag == true) {
                            this.isLoading = false;
                        }
                    }

                    this.isLoading = false;

                });
            })
            .catch(error => {
                console.error("Error unzipping file:", error);
                this.isLoading = false;
            });
    }


    convertXmlToJson(xml) {
        console.log(`window.xml2json.XMLParser ==> ${window.xml2json.XMLParser}`);
        console.log(`window ==> ${window}`);

        // Check if the library is loaded and if the expected global is defined
        if (!this.isxml2jsonLibraryLoaded || !window.xml2json?.XMLParser) {
            console.error('xml2json is not available.');
            // this.dataContent = 'Error: xml2json is not available.';
            return;
        }
        try {
            const parser = new window.xml2json.XMLParser();
            const jsonObj = parser.parse(xml);
            this.dataContent = JSON.stringify(jsonObj, null, 2);
            console.log('✅ Converted JSON:', this.dataContent);
        } catch (error) {
            console.error('❌ Error converting XML to JSON:', error);
            // this.dataContent = 'Error converting XML to JSON: ' + error.message;
        }
    } 

    async selectedMetadataRetrieveAgain() {
        const retrObj = await retrieveViaSelectedMetadata({
            metadataItems: this.selectedField,
            typeClass: this.value,
        });
        if (!retrObj) {
            return await this.selectedMetadataRetrieveAgain();
        } else {
            return retrObj;
        }
    }

    handleClick2(event) {
        if (this.value == 'EmailTemplate') {
            this.showEmailDropdown2 = true;
        }
        else {
            this.showDropdown2 = true;
        }
    }

    handleSearchChange2(event) {
        this.isShowComparision = false;
        this.searchKey2 = event.target.value;
        console.log(`this.searchKey ==>${this.searchKey}`);
        if (this.value == 'EmailTemplate') {
            this.filterList2 = this.clickedMetadataItems2?.filter(item =>
                typeof item === 'string' && item.toLowerCase().includes(this.searchKey2)
            );
            console.log(`EmailTemplate this.filterList ==> ${JSON.stringify(this.filterList2)}`);
            this.showEmailDropdown2 = true;
            this.showDropdown2 = false;
        }
        else {
            this.filterList2 = this.clickedMetadataItems2?.filter(item =>
                item.fullName?.toLowerCase().includes(event.target.value.toLowerCase()
                ));
            console.log(`else this.filterList2 ==> ${JSON.stringify(this.filterList2)}`);
            this.showDropdown2 = true;
            this.showEmailDropdown = false;
        }
    }

    // Handle selection from the dropdown
    async handleOptionSelect2(event) {
        this.isShowCompareBtn = true;
        this.selectAllAura = false;
        this.selectAllLwc = false;

        this.filesOrg1 = [];
        this.filesOrg2 = [];

        this.isLoading = true;
        this.selectedFiles = {};
        this.isShowComparision = false;
        this.isShowTable = true;

        // this.dataContent = '';
        this.dataContent2 = '';
        this.selectedField2 = [];

        console.log(`event ===> ${event}`);
        this.optionSelect2 = event.currentTarget.dataset.value;
        let dataName = event.currentTarget.dataset.value;
        // console.log(`event.currentTarget.dataset.value ==> ${event.currentTarget.dataset.value}`);
        // console.log(`Json dataName ==> ${JSON.stringify(dataName)}`);
        console.log(`dataName fullName ==> ${dataName}`);
        this.selectedField2.push(dataName);

        if (this.value == 'EmailTemplate') {
            this.showEmailDropdown2 = false;
            // Apex Conttroller fetches ApexTrigger from Side org
            getEmailTemplateFromConnectedOrg({ 'emailTemplateName': dataName })
                .then(result => {
                    console.log(`result from getEmailTemplateFromConnectedOrg = ${result}`);
                    let stringData = JSON.parse(result);
                    stringData.records.map(item => {
                        // if (item.DeveloperName == selectedValue) {
                        this.dataContent2 = item.Body;
                        console.log('dataContent2 updated:', this.org2Text);
                        this.isLoading = false;
                        // }
                    })
                })
                .catch(error => {
                    console.log(`error => ${error}`);
                    this.isLoading = false;
                })
        }
        else {
            this.showDropdown2 = false;

            if (this.value === 'LightningComponentBundle') {
                console.log(`Opeming Model....`);
                console.log(`In IF this.isLoading ==-> ${this.isLoading}`);
                this.isShowLwcModel = true; // Show popup for LWC file selection

            }
            else if (this.value === 'AuraDefinitionBundle') {
                this.isAuraModalOpen = true; // Show popup for LWC file selection
            }
            else {
                console.log(`Inside else...`);
                const metaRetrieveId2 = await this.selectedMetadataRetrieveAgain2();
                if (metaRetrieveId2) {
                    const checkSts2 = await this.checkRetrieve2(metaRetrieveId2);
                    // if (checkSts2) {
                    //     // this.ShowToast('Success', 'Data Loaded successfully', 'success', 'dismissable');
                    //     // this.isLoading = false;
                    // }
                }
            }

            console.log(`End of HandleOptionsSlect2 this.isLoading ==-> ${this.isLoading}`);
             

        }
    } 

    unzipBackup2(base64Zip) {
        if (!this.jszipJsLoaded) {
            console.error("JSZip is not loaded yet.");
            return;
        }

        const byteCharacters = atob(base64Zip);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }

        JSZip.loadAsync(byteArray)
            .then(zip => {
                console.log("Zip Loaded Successfully");

                let fileEntries = [];

                zip.forEach((relativePath, zipEntry) => {
                    const fileName = relativePath.split('/').pop();
                    const fileExtension = fileName.split('.').pop().toLowerCase();

                    // Skip XML files
                    if (fileExtension === 'xml') {
                        console.log(`Skipping XML file: ${fileName}`);
                        return;
                    }

                    fileEntries.push({ relativePath, zipEntry, fileName, fileExtension });
                });

                // Define order for sorting (CSS → HTML → JS → Other metadata)
                const orderPriority = {
                    css: 1,
                    html: 2,
                    js: 3,
                    apex: 4,   // Apex classes & triggers
                    aura: 5,   // Aura components
                    other: 10  // Other metadata types
                };

                fileEntries.sort((a, b) => {
                    let typeA = orderPriority[a.fileExtension] || orderPriority.other;
                    let typeB = orderPriority[b.fileExtension] || orderPriority.other;
                    return typeA - typeB;
                });

                let dataContent = '';
                let readPromises = [];

                fileEntries.forEach(({ zipEntry, fileName, fileExtension }) => {
                    // Only include selected file types from popup
                    if (
                        this.value === 'LightningComponentBundle' &&
                        !(
                            (this.selectedFiles.html && fileExtension === 'html') ||
                            (this.selectedFiles.css && fileExtension === 'css') ||
                            (this.selectedFiles.js && fileExtension === 'js')
                        )
                    ) {
                        return; // Skip unselected files in LWC
                    }
                    if (this.value === 'AuraDefinitionBundle') {
                        if (
                            (!this.selectedFiles.auraComponent && fileExtension === 'cmp') ||
                            (!this.selectedFiles.auraHelper && fileName.includes('Helper.js')) ||
                            (!this.selectedFiles.auraController && fileName.includes('Controller.js')) ||
                            (!this.selectedFiles.auraRenderer && fileName.includes('Renderer.js')) ||
                            (!this.selectedFiles.design && fileExtension === 'design') ||
                            (!this.selectedFiles.css && fileExtension === 'css')
                        ) {
                            return;
                        }
                    }

                    console.log(`✅ Including file: ${fileName}`);
                    readPromises.push(
                        zipEntry.async('string').then(content => {
                            dataContent += `// ***** ${fileName}  ==> \n${content}\n\n`;
                            this.filesOrg2.push({ content, fileName, fileExtension });
                            console.log(`this.filesOrg2 ==> ${JSON.stringify(this.filesOrg2)}`);
                        })
                    );
                });

                console.log("Total Files Selected: ", readPromises.length);

                if (readPromises.length === 0) {
                    console.warn("🚨 No files matched the selection. dataContent 2 will be empty.");
                }
                console.log(`readPromises ==> ${JSON.stringify(readPromises)}`);
                return Promise.all(readPromises)
                    .then(() => {
                        this.dataContent2 = dataContent;
                        console.log(`✅ Final this.dataContent 2 : \n ${this.dataContent}`);
                        // this.isLoading = false;
                        this.isLoading = false;
                        console.log(` this.isLoading  ==> ${this.isLoading}`);
                    });
            })
            .catch(error => {
                console.error("Error unzipping file:", error);
                this.isLoading = false;
                return false;
            });
    }
 

    async retrieveAgain2() {
        const retrObj = await retrive2({
            metadataItems: this.selectedField2,
            typeClass: this.value,
        });
        if (!retrObj) {
            return await this.retrieveAgain2();
        }
        else {
            return retrObj;
        }
    }

    async selectedMetadataRetrieveAgain2() {
        const retrObj = await retrieveViaSelectedMetadata2({
            metadataItems: this.selectedField2,
            typeClass: this.value,
        });
        if (!retrObj) {
            return await this.selectedMetadataRetrieveAgain2();
        } else {
            return retrObj;
        }
    }


    // For Showing Show Toast Event
    ShowToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    // For handle Sroll with same
    handleScroll(event) {
        const otherDiv = this.template.querySelectorAll('.code-box');

        // Get the scroll position of the currently scrolled div
        const scrollTop = event.target.scrollTop;

        // Synchronize scroll position with the other div
        otherDiv.forEach((div) => {
            if (div !== event.target) {
                div.scrollTop = scrollTop;
            }
        });
    }

    // =================================================***********************************=================================================

    /*For Aura Selection : Starts */
    isAuraModalOpen = false;

    handleAuraSelectAll(event) {
        const check = event.target.checked;
        this.selectAllAura = check;

        this.selectedFiles = {};
        const fileType = ['css', 'design', 'auraRenderer', 'auraComponent', 'auraHelper', 'auraController'];
        fileType.forEach(type =>
            this.selectedFiles[type] = check
        );
    }

    handleAuraSelection(event) {
        const fileType = event.target.dataset.name;
        this.selectedFiles[fileType] = event.target.checked;

        this.selectAllAura = ['design', 'auraRenderer', 'auraComponent', 'auraHelper', 'auraController'].every(key =>
            this.selectedFiles[key]
        );

    }

    // Open Modal
    openAuraModal() {
        this.isAuraModalOpen = true;
    }

    // Close Modal
    closeAuraModal() {
        this.isAuraModalOpen = false;
    }
 
    showErrorToast(title, message, variant, mode) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: mode
            })
        )
    }

    handleLwcSelectAll(event) {
        const check = event.target.checked;
        this.selectAllLwc = check;
        const fileTypes = ['css', 'html', 'js'];
        this.selectedFiles = {};
        fileTypes.forEach(type => {
            this.selectedFiles[type] = check;
        });
    }

    /*For LWc Selection : Starts */
    handleFileSelection(event) {
        const fileType = event.target.dataset.filetype;
        this.selectedFiles[fileType] = event.target.checked;

        // if any of the three is false, clear the “Select All” box
        this.selectAllLwc = ['css', 'html', 'js']
            .every(key => this.selectedFiles[key]);
        console.log(`this.selectAllLwc: ${this.selectAllLwc}`);

        console.log(`File selection changed: ${fileType} = ${event.target.checked}`);
        console.log(`this.selectedFiles: ${JSON.stringify(this.selectedFiles)}`);
    }

    async handleProceed() {
        const anyOneChecked = Object.values(this.selectedFiles).some(val =>
            val == true
        );
        if (!anyOneChecked) {
            this.ShowToast('', 'PLease Select Any one Checkbox..', 'error', 'dismissible');
            return;
        }
        console.log(`this.selectedFiles ==> ${JSON.stringify(this.selectedFiles)}`);
        console.log(`type of this.selectedFiles ==> ${typeof this.selectedFiles}`);
        // this.isLoading2=true;
        this.isShowResetBtn = false;
        this.isShowCompareBtn = true;
        this.isShowLwcModel = false;
        this.isLoading2 = true;
        this.isAuraModalOpen = false;

        //  this.handleClickMetadataItems(this.value);
        const metaRetrieveId = await this.selectedMetadataRetrieveAgain();
        if (metaRetrieveId) {
            const checkSts = await this.checkRetrieve(metaRetrieveId);
            console.log(`checkSts ==>${checkSts}`);
            // if (checkSts) {
            //     // this.ShowToast('Success', 'Data Loaded successfully', 'success', 'dismissable');
            //     // this.isLoading = false;
            //     console.log(`trueeeee.1`);
            // }
        }

        const metaRetrieveId2 = await this.selectedMetadataRetrieveAgain2();
        // if (metaRetrieveId2) {
        const checkSts2 = await this.checkRetrieve2(metaRetrieveId2);
        console.log(`checkSts2 ==>${checkSts2}`);
        // if (checkSts2) {
        //     // this.ShowToast('Success', 'Data Loaded successfully', 'success', 'dismissable');

        //     // console.log(`trueeeee.2`);
        //     // const unzipFile=await this.unzipBackup2(checkSts2.zipFile);
        //     // console.log(`unzipFile ==> ${unzipFile}`);
        // }
        // }
        // this.clearDiffSections();
        // this.isLoading = false;
        setTimeout(() => {
            this.isLoading2 = false;
            console.log(` this.isLoading2 ==> ${this.isLoading2}`);
        }, 3000);
    }

    handleClose() {
        this.isShowLwcModel = false;
        this.isLoading = false;
        this.isLoading2 = false;
    }
    /*For LWc Selection : Ends */


    async checkRetrieve2(metaRetrieveId) {
        const retrieveObj = await checkStatus2({
            asyncProcessId: metaRetrieveId,
            includeZip: true
        });
        console.log("Id " + retrieveObj.id);
        if (retrieveObj && retrieveObj.zipFile) {
            console.log(`retrieveObj ==>${JSON.stringify(retrieveObj)}`);
            const zipBase64 = retrieveObj.zipFile;
            // Call unzip function
            this.unzipBackup2(zipBase64);

            return retrieveObj;
        }
        else {
            return await this.checkRetrieve2(metaRetrieveId);
        }

    }


    /*========================================================================
    ==========================================================================*/

    @track isShowLwcComparision = false;

    isShowLwcAuraComparision = false;
    @track isLoading2 = false;

    // Summary counts
    @track removalsCount = 0;
    @track additionsCount = 0;

    decodeForDiff(text) {
        // Replace &quot; with a literal double quote
        return text.replace(/&quot;/g, '"');
    }

    normalizeForDiff(text) {
        return text
            .replace(/\r\n/g, '\n')  // Convert CRLF to LF
            .replace(/\u200B/g, '')  // Remove zero-width spaces
            .replace(/[^\S\r\n]+$/gm, '') // Remove trailing spaces (without affecting line structure)
            .replace(/\n+$/, '') // Remove extra newlines at the end
            .trim(); // Trim the entire text
    }  

    compareCode() {
        this.isShowResetBtn = true;
        this.isShowCompareBtn = false;
        // this.isLoading2 = true;

        if (this.value == 'LightningComponentBundle' || this.value == 'AuraDefinitionBundle') {
            this.compareAllFiles();
        }
        else {
            console.log('Compare Changes button clicked....!!!');
            this.originalLines = [];
            this.modifiedLines = [];

            // Create copies for diffing that normalize only trailing whitespace and line break style
            const diffOrg1 = this.normalizeForDiff(this.decodeForDiff(this.dataContent));
            const diffOrg2 = this.normalizeForDiff(this.decodeForDiff(this.dataContent2));

            this.generateDiff(diffOrg1, diffOrg2);

            // this.generateDiff(this.dataContent, this.dataContent2);
            this.isShowTable = false;
            this.isShowSideDropdown = false;
            this.isShowComparision = true;
            this.isShowLwcAuraComparision = false;
        }
    }

    generateDiff(org1Text, org2Text) {
        console.log('generateDiff is called....!!!!'); 
        // Clear previous results
        this.originalLines = [];
        this.modifiedLines = [];

        // Generate the diff using jsDiff
        const diff = window.Diff.diffLines(org1Text, org2Text, { newlineIsToken: true });

        let originalKey = 0;
        let modifiedKey = 0;
        let originalLineNumber = 1;
        let modifiedLineNumber = 1;

        this.additionsCount = 0;
        this.removalsCount = 0;

        diff.forEach((part) => {
            const lines = part.value.split('\n');

            // Count additions/removals for the chunk
            if (part.added) {
                // Exclude empty final line (split('\n') often adds one empty)
                this.additionsCount += lines.filter(l => l.trim() !== '').length;
            } else if (part.removed) {
                this.removalsCount += lines.filter(l => l.trim() !== '').length;
            }

            lines.forEach((line, index) => {
                const displayLine = line.trimEnd(); // Removes only trailing spaces 
                if (part.added) {
                    while (this.originalLines.length < this.modifiedLines.length) {
                        this.originalLines.push({
                            key: originalKey++,
                            text: '\u200B',  // Ensure empty space is rendered
                            className: 'removed',  // Highlight it as removed
                            lineNumber: originalLineNumber++
                        });
                    }
                    this.modifiedLines.push({
                        key: modifiedKey++,
                        text: displayLine || '\u200B',
                        className: 'added',
                        lineNumber: modifiedLineNumber++
                    });

                } else if (part.removed) {
                    while (this.modifiedLines.length < this.originalLines.length) {
                        this.modifiedLines.push({
                            key: modifiedKey++,
                            text: '\u200B',
                            className: 'added',  // Highlight it as added
                            lineNumber: modifiedLineNumber++
                        });
                    }
                    this.originalLines.push({
                        key: originalKey++,
                        text: displayLine || '\u200B',
                        className: 'removed',
                        lineNumber: originalLineNumber++
                    });
                } else {
                    this.originalLines.push({
                        key: originalKey++,
                        text: displayLine || '\u200B',
                        className: 'unchanged',
                        lineNumber: originalLineNumber++
                    });
                    this.modifiedLines.push({
                        key: modifiedKey++,
                        text: displayLine || '\u200B',
                        className: 'unchanged',
                        lineNumber: modifiedLineNumber++
                    });
                }


            });
        });

        console.log('Original:', JSON.stringify(this.originalLines));
        console.log('Modified:', JSON.stringify(this.modifiedLines));
    }




    resetCodeHandler() {
        console.log(`resetCodeHandler() is called...!!!`);
        this.isShowComparision = false;

        this.isShowTable = true;
        this.isShowSideDropdown = true;
        this.isShowLwcAuraComparision = false;

        // this.isShowLwcAuraComparision = false;

        this.isShowResetBtn = false;
        this.isShowCompareBtn = true;
        this.isLoading = false;
        this.isLoading2 = false;
        // this.filesOrg1=[];
        // this.filesOrg2=[];
    }



    compareAllFiles() {
        if (!(this.filesOrg1 && this.filesOrg2)) {
            return;
        }

        if (this.value == 'LightningComponentBundle') {
            const sameMeta = this.optionSelect === this.optionSelect2;
            if (sameMeta) {
                this.sameMetadata();
                return;
            }
            this.diffMetadata();
        }
        else if (this.value == 'AuraDefinitionBundle') {
            const sameMeta = this.optionSelect === this.optionSelect2;
            if (sameMeta) {
                this.sameMetadata();
                return;
            }
            this.diffAuraBundle();
        }

    }

    diffAuraBundle() {
        const comp1 = this.optionSelect;
        const comp2 = this.optionSelect2;

        const roles = [
            { extension: 'cmp', suffix: '', label: 'Component Markup' },
            { extension: 'design', suffix: '', label: 'Design File' },
            { extension: 'js', suffix: 'Controller', label: 'Controller' },
            { extension: 'js', suffix: 'Helper', label: 'Helper' },
            { extension: 'js', suffix: 'Renderer', label: 'Renderer' },
            { extension: 'css', suffix: '', label: 'Stylesheet' }
        ];

        // Build a new comparisonResult array
        const result = roles.map(role => {
            // include the actual file extension when building the file name
            const name1 = role.suffix
                ? `${comp1}${role.suffix}.${role.extension}`
                : `${comp1}.${role.extension}`;
            const name2 = role.suffix
                ? `${comp2}${role.suffix}.${role.extension}`
                : `${comp2}.${role.extension}`;

            // use the correct property (fileExtension) for filtering
            const f1 = this.filesOrg1.find(f =>
                f.fileExtension === role.extension &&
                f.fileName === name1
            ) || { fileName: '(none)', fileExtension: role.extension, content: '' };

            const f2 = this.filesOrg2.find(f =>
                f.fileExtension === role.extension &&
                f.fileName === name2
            ) || { fileName: '(none)', fileExtension: role.extension, content: '' };

            // if both sides are empty, drop this role
            if (!f1.content.trim() && !f2.content.trim()) {
                return null;
            }

            const section = this._makeSection(f1, f2);
            section.roleLabel = role.label;
            return section;
        })
            .filter(s => s);  // drop the nulls

        this.comparisonResult = result;
        this.isShowLwcAuraComparision = true;
        this.isShowComparision = false;
        this.isShowSideDropdown = false;
        this.isShowTable = false;

        console.log('Aura diff result:', JSON.stringify(this.comparisonResult));
    }

    diffMetadata() {
        const componentName1 = this.optionSelect;
        const componentName2 = this.optionSelect2;

        // 1) Collect every fileExtension present in either bundle
        const extensions = new Set([
            ...this.filesOrg1.map(f => f.fileExtension),
            ...this.filesOrg2.map(f => f.fileExtension)
        ]);

        // 2) Reset the comparisonResult array
        this.comparisonResult = [];

        // 3) For each extension, push one diff section for the main file + any extras
        extensions.forEach(ext => {
            // Main file (e.g. myCmp.html vs yourCmp.html)
            const f1Main = this.filesOrg1.find(f =>
                f.fileExtension === ext &&
                f.fileName.split('.')[0] === componentName1
            );
            const f2Main = this.filesOrg2.find(f =>
                f.fileExtension === ext &&
                f.fileName.split('.')[0] === componentName2
            );

            this._pushDiffSection(
                f1Main || { fileName: '', fileExtension: ext, content: '' },
                f2Main || { fileName: '', fileExtension: ext, content: '' }
            );

            // Extras in Org1 (same extension, but not the main file)
            const extras1 = this.filesOrg1.filter(f =>
                f.fileExtension === ext && f !== f1Main
            );
            // Extras in Org2
            const extras2 = this.filesOrg2.filter(f =>
                f.fileExtension === ext && f !== f2Main
            );

            // Match extras by filename where possible
            const used2 = new Set();
            extras1.forEach(extra1 => {
                const match = extras2.find(extra2 =>
                    extra2.fileName === extra1.fileName
                );
                if (match) {
                    used2.add(match.fileName);
                    this._pushDiffSection(extra1, match);
                } else {
                    // Org1-only file
                    this._pushDiffSection(extra1, { fileName: '', fileExtension: ext, content: '' });
                }
            });

            // Any Org2-only extras left over?
            extras2.forEach(extra2 => {
                if (!used2.has(extra2.fileName)) {
                    this._pushDiffSection({ fileName: '', fileExtension: ext, content: '' }, extra2);
                }
            });
        });

        // 4) Flip the UI into “LWC/Aura diff” mode
        this.isShowLwcAuraComparision = true;
        this.isShowComparision = false;
        this.isShowSideDropdown = false;
        this.isShowTable = false;
    } 

    _pushDiffSection(f1, f2) {
        console.log(`_pushDiffSection is ccalled ...`)
        console.log(`f1 ==> ${JSON.stringify(f1)} \n f2 ==> ${JSON.stringify(f2)}`);

        const section = this._makeSection(f1, f2);

        // only push if we actually got a section object back
        if (section) {
            this.comparisonResult.push(section);
        }
        // this.comparisonResult.push(section);
        console.log(`_pushDiffSection's this.comparisonResult ==> ${JSON.stringify(this.comparisonResult)}`)
    }

    // Build a single diff section
    _makeSection(f1, f2) {
        console.log(`_makeSection is called ...`);

        // skip empty stubs
        if (!f1.content.trim() && !f2.content.trim()) {
            return;
        }

        const c1 = this.normalizeForDiff(this.decodeForDiff(f1.content || ''));
        const c2 = this.normalizeForDiff(this.decodeForDiff(f2.content || ''));
        console.log(`c1 = => ${c1} \n c2 ==> ${c2}`);
        const { originalLines, modifiedLines, additionsCount, removalsCount }
            = this.generateFileDiff(c1, c2);

        return {
            id: `${f1.fileName || f2.fileName}-${Date.now()}-${Math.random()}`,
            displayName: `${f1.fileName || f2.fileName} }`,
            leftName: f1.fileName || '(none)',
            rightName: f2.fileName || '(none)',
            originalLines,
            modifiedLines,
            additionsCount,
            removalsCount
        };
    }

    sameMetadata() {
        // Are they the same metadata bundle?
        const sameMeta = this.optionSelect === this.optionSelect2;

        // If same, key on “name-ext”; otherwise just on “ext”
        const keyFn = sameMeta
            ? f => `${f.fileName}-${f.fileExtension}`
            : f => f.fileExtension;

        // Build two maps of either single files (sameMeta) or by extension (diffMeta)
        const map1 = this.filesOrg1.reduce((m, f) => {
            const k = keyFn(f);
            m[k] = m[k] || [];
            m[k].push(f);
            return m;
        }, {});
        const map2 = this.filesOrg2.reduce((m, f) => {
            const k = keyFn(f);
            m[k] = m[k] || [];
            m[k].push(f);
            return m;
        }, {});

        // Union of all keys
        const allKeys = new Set([...Object.keys(map1), ...Object.keys(map2)]);

        // For each key, pair off files (or stubs) under that key
        this.comparisonResult = Array.from(allKeys).flatMap(key => {
            const arr1 = map1[key] || [];
            const arr2 = map2[key] || [];
            const maxLen = Math.max(arr1.length, arr2.length);

            return Array.from({ length: maxLen }, (_, idx) => {
                // Use fileExtension on stubs too
                const f1 = arr1[idx] || { fileName: '', fileExtension: key, content: '' };
                const f2 = arr2[idx] || { fileName: '', fileExtension: key, content: '' };

                // Normalize and diff
                const c1 = this.normalizeForDiff(this.decodeForDiff(f1.content || ''));
                const c2 = this.normalizeForDiff(this.decodeForDiff(f2.content || ''));
                const { originalLines, modifiedLines, additionsCount, removalsCount }
                    = this.generateFileDiff(c1, c2);

                return {
                    id: `${(f1.fileName || f2.fileName)}-${Date.now()}-${Math.random()}`,
                    displayName: `${f1.fileName || f2.fileName}.${f1.fileExtension}`,
                    leftName: f1.fileName || '(none)',
                    rightName: f2.fileName || '(none)',
                    originalLines,
                    modifiedLines,
                    additionsCount,
                    removalsCount
                };
            });
        });

        // Show the LWC/Aura comparison UI only
        this.isShowLwcAuraComparision = true;
        this.isShowComparision = false;
        this.isShowSideDropdown = false;
        this.isShowTable = false;
    } 


    /**
     * generateFileDiff produces the diff between two versions of text using jsDiff.
     */
    generateFileDiff(org1Text, org2Text) {
        const diff = Diff.diffLines(org1Text, org2Text, { newlineIsToken: true });
        let orig = [], mod = [], adds = 0, rems = 0;
        let oNum = 1, mNum = 1, oKey = 0, mKey = 0;

        diff.forEach(part => {
            const lines = part.value.split('\n');
            // Count non-empty lines for additions and removals.
            if (part.added) adds += lines.filter(l => l.trim()).length;
            if (part.removed) rems += lines.filter(l => l.trim()).length;

            lines.forEach(line => {
                const text = line.trimEnd() || '\u200B';
                if (part.added) {
                    // Ensure both columns line up.
                    while (orig.length < mod.length) {
                        orig.push({ key: oKey++, text: '\u200B', className: 'removed', lineNumber: oNum++ });
                    }
                    mod.push({ key: mKey++, text, className: 'added', lineNumber: mNum++ });
                } else if (part.removed) {
                    while (mod.length < orig.length) {
                        mod.push({ key: mKey++, text: '\u200B', className: 'added', lineNumber: mNum++ });
                    }
                    orig.push({ key: oKey++, text, className: 'removed', lineNumber: oNum++ });
                } else {
                    orig.push({ key: oKey++, text, className: 'unchanged', lineNumber: oNum++ });
                    mod.push({ key: mKey++, text, className: 'unchanged', lineNumber: mNum++ });
                }
            });
        });

        return {
            originalLines: orig,
            modifiedLines: mod,
            additionsCount: adds,
            removalsCount: rems
        };
    }
 

    // Compare properties Js : starts
    @track isShowPropertiesPopUp = false;
    compareProperties(event) {
        console.log(`compareProperties is called...!!!`);
        this.isShowPropertiesPopUp = true;

    }

    handleClosePropertiesPopUp() {
        this.isShowPropertiesPopUp = false;
    }
    // Compare properties Js : Ends 

    handleScroll2(event) {
        // the div the user actually scrolled
        const scrolled = event.target;
        // find the common parent that wraps exactly the two boxes
        const container = scrolled.closest('.diff-container');
        if (!container) {
            return;
        }
        // sync only the siblings in this container
        const siblings = container.querySelectorAll('.code-box');
        siblings.forEach(box => {
            if (box !== scrolled) {
                box.scrollTop = scrolled.scrollTop;
            }
        });
    }




}