const http = require('http');
const cheerio = require('cheerio');
const { default: axios } = require('axios');
const models = require('./models');

async function crawl(){

    const urls = [
        'https://www.srilanka.travel/', 
        'https://www.bluelankatours.com/', 
        'https://www.danflyingsolo.com/', 
        'https://followtheboat.com/', 
        'https://www.lonelyplanet.com/sri-lanka', 
        'https://www.olankatravels.com/'
    ];

    console.log('App running!');

    await fetchDataFromURL("https://sltda.gov.lk/en");

    const locations = await getLocations();
    console.log(locations);

}


const getLocations = async () => {
    try{
        const locations = await models.Location.findAll();
        return locations;
    }catch(err) {
        console.log(err);
        return [];
    }
}


const fetchDataFromURL = async (url) => {
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

    const paras = new Set(parasArr);
    const headings = new Set([...h1Text, ...h2Text, ...h3Text, ...h4Text, ...h5Text, ...h6Text]);
    const links = new Set(linksHrefs.map((index, elem) => elem.attribs.href));
}


module.exports = crawl();