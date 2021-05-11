const http = require('http');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');


const models = require('./models');

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


const writeFile = (data) => {
    try{
        dataObj = JSON.parse(data);
        fs.appendFileSync('output.txt', "\n===================\n"+"URL: "+dataObj.url+"\n"+"Keywords: "+dataObj.words+"\n"+"Locations: "+dataObj.locations);
    }catch(err) {
        console.log(err);
    }
}


const fetchDataFromURL = async (url) => {
    try {
        const result = await axios.get(url);
        const page_data = cheerio.load(result.data);

        const parasArr = page_data('p').text().split(" ");

        const h1Text = page_data('h1').text().split(" ");
        const h2Text = page_data('h2').text().split(" ");
        const h3Text = page_data('h3').text().split(" ");
        const h4Text = page_data('h4').text().split(" ");
        const h5Text = page_data('h5').text().split(" ");
        const h6Text = page_data('h6').text().split(" ");

        const linksHrefs = page_data('a');

        const texts = new Set([...parasArr, ...h1Text, ...h2Text, ...h3Text, ...h4Text, ...h5Text, ...h6Text]);
        const links = new Set(linksHrefs.map((index, elem) => elem.attribs.href));

        links.forEach(async function(link) {
            if(!link.startsWith("#")){
                await fetchDataFromURL(link);
            }
        });

        return texts;
    }catch(err) {
        console.log(err)
    }
}


module.exports = main();