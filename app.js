const http = require('http');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');


const models = require('./models');

//the main function that invokes other functions.
async function main(){

    const urls = [
        'https://sltda.gov.lk/en',
        'http://www.legalnomads.com/',
        'http://www.uncorneredmarket.com/',
        'http://www.alexinwanderland.com/',
        'http://theblondeabroad.com/',
        'http://www.heynadine.com/',
        'http://viewfromthewing.boardingarea.com/',
        'http://www.wanderingearl.com/'
    ];

    console.log('App running!');

    urls.map(url => {
        checkMatchings(url);
    });

}

/*
This function matches all the content grabbed from websites with the Keywords and the locations available. 
If a match found, it'll break the loop and write on the file - output.txt. 
When it finished writing 5 URLs, it stops the process.
*/

const checkMatchings = async (url) => {
    
    const pageData = await fetchDataFromURL(url);
    const locations = await getLocations();

    //Get Keywords from the file
    var keywords = fs.createReadStream('./keywords.txt');
    var outstream = new stream;
    var rl = readline.createInterface(keywords, outstream);

    let keywordsArr = [];

    rl.on('line', function(line) {
        keywordsArr.push(line);
    }).on('close', async function() {
        
        //Do the magic here!

        let resArr = [];
        let breakLoopOne = false;
        for (word of keywordsArr) {

            if(word != ""){
                
                for (location of locations) {
                    
                    if (Array.from(pageData).includes(word) && Array.from(pageData).includes(location)) {

                        let resObj = {
                            url: url,
                            words:word,
                            locations: location
                        };
                    
                        //I know it's bad practice to put a blocking function here. :-(
                        writeFile(JSON.stringify(resObj));

                        breakLoopOne = true;
                        break;

                    }
                }
            }
            if (breakLoopOne) break;
        }
        
        if(resArr.length >= 5){
            process.exit();
        }
        

    });
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
        dataObj = JSON.parse(data);
        fs.appendFileSync('output.txt', "\n===================\n"+"URL: "+dataObj.url+"\n"+"Keywords: "+dataObj.words+"\n"+"Locations: "+dataObj.locations);
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

        const parasArr = page_data('p').text().split(" "); //Het paragraph texts

        //Get headings texts
        const h1Text = page_data('h1').text().split(" ");
        const h2Text = page_data('h2').text().split(" ");
        const h3Text = page_data('h3').text().split(" ");
        const h4Text = page_data('h4').text().split(" ");
        const h5Text = page_data('h5').text().split(" ");
        const h6Text = page_data('h6').text().split(" ");

        //grabbing links
        const linksHrefs = page_data('a');

        //Meeging all the texts and create a set.
        const texts = new Set([...parasArr, ...h1Text, ...h2Text, ...h3Text, ...h4Text, ...h5Text, ...h6Text]);
        const links = new Set(linksHrefs.map((index, elem) => elem.attribs.href)); //getting only hrefs from links.

        links.forEach(async function(link) {
            if(!link.startsWith("#")){ // filter hrefs with invalid or ID links.
                await fetchDataFromURL(link);
            }
        });

        return texts;
    }catch(err) {
        console.log(err)
    }
}


module.exports = main();