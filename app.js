const http = require('http');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const elasticlunr = require('elasticlunr');
const keywords_extractor = require('keyword-extractor');
const micromatch = require('micromatch');


const models = require('./models');

//the main function that invokes other functions.
async function main(){

    const urls = [
        'https://www.npmjs.com/package/search-index',
        'https://sltda.gov.lk/en',
        'http://www.sidetrackedtravelblog.com/canada',
        'https://www.anadventurousworld.com/north-america/canada'
    ];

    const locations = await getLocations();

    fs.readFile("./keywords.txt", "UTF8", function(err, storedKeywords) {

        const responseToWrite = urls.map(async url => 
            await checkMatchings(url, storedKeywords, locations)
        );

        
        Promise.all(responseToWrite).then(function(results) {
            console.log(results)
        })
    });
}

/*
This function matches all the content grabbed from websites with the Keywords and the locations available. 
If a match found, it'll break the loop and write on the file - output.txt. 
When it finished writing 5 URLs, it stops the process.
*/

const checkMatchings = async (url, storedKeywords, locations) => {

    const stored_keywrods_para = storedKeywords.replace(/(\r\n|\n|\r)/gm," ");
    const page_data = await fetchDataFromURL(url);
    const page_keywords_str = page_data.pageKeywords.join(" ");

    //Checking if matching locations found.
    const matched_locations = micromatch(locations, page_data.pageKeywords, { nocase: true });

    var index = elasticlunr(function () {
        this.addField('body');
        this.setRef('id');
    });
     
    var doc1 = {
        "id": 1,
        "body": stored_keywrods_para
    }
     
    index.addDoc(doc1);
    const rating = index.search(page_keywords_str);

    //This is a silly logic but trust me it works!
    //If the score is above 0.01, it means there's a great possibility that it's a travel website.
    //The cutoff score is based on the keywords we have in our storage. 

    if(rating[0] && (rating[0].score > 0.01)){
        const obj_to_write = {
            url: url,
            keywords: page_data.pageKeywords.slice(0,6),
            locations:matched_locations
        };
        writeFile(obj_to_write);
        return page_data.links;
    }   
}

/*
A function for retrieving locations from the database
*/
const getLocations = async () => {
    try{
        const locations = await models.Location.findAll({
            attributes: [`name`],
            raw : true
        });
        return locations.map(a => a.name);
    }catch(err) {
        console.log(err);
        return [];
    }
}


/*
A simple Synchronous function for writing a file with grabbed URLS, 
*/

const writeFile = (data) => {
    try{
        fs.appendFileSync('output.txt', "\n===================\n"+"URL: "+data.url+"\n"+"Keywords found: "+data.keywords+"\n"+"Locations mentioned: "+data.locations);
    }catch(err) {
        console.log(err);
    }
}


/*
This function featch content of a web page and it seperates
Contents as h1,h2,h3,h4,h5,h6 and p. And also it grabs hrefs as well.

The all the textual content is merged to an array and returns. 

And it checks for the links. Go to those links and grabs their texts too. 
This happens recursively until it finds no links left. 

*/

const fetchDataFromURL = async (url) => {
    try {
        const result = await axios.get(url);
        const page_data = cheerio.load(result.data);

        const parasArr = page_data('p').text().split(" ");; //Het paragraph texts

        //Get headings texts
        const h1Text = page_data('h1').text().split(" ");
        const h2Text = page_data('h2').text().split(" ");
        const h3Text = page_data('h3').text().split(" ");
        const h4Text = page_data('h4').text().split(" ");
        const h5Text = page_data('h5').text().split(" ");
        const h6Text = page_data('h6').text().split(" ");

        //grabbing links
        const linksHrefs = page_data('a');

        const allTextsArr = new Set([...parasArr, ...h1Text, ...h2Text, ...h3Text, ...h4Text, ...h5Text, ...h6Text]);
        const allLinksArr = new Set(linksHrefs.map((index, elem) => elem.attribs.href)); //getting only href attrs from links.
        
        const allTextsStr = [...allTextsArr].join(' ')

        const pageKeywords = keywords_extractor.extract(allTextsStr,{
            language:"english",
            remove_digits: true,
            return_changed_case:true,
            remove_duplicates: true
        });


        return {
            pageKeywords: pageKeywords,
            links: allLinksArr
        };
    }catch(err) {
        console.log(err)
    }
}


module.exports = main();