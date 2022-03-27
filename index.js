import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';

const main = async () => {
  const argv1 = process.argv.slice(2);
  const argv2 = process.argv.slice(3);
  
  const url = argv1[0];
  const depth = argv2[0];
  
  getUrls(url, depth);
}

const getUrls = async (url, iterations) => {
  const semi_results = [];
  const arr = [];
  const images = [];

  arr.push(url);
  
  for (let i = 0; i < iterations; i++) {
    if (i > 0) {
      arr.length = 0;
      arr.push(semi_results)
    }
    for (let j = 0; j < arr.length; j++) {
      try {
        const res = await request(arr[j]);
        const html = await res.text()
        const $ = cheerio.load(html);
        const current_url = res.url;
        const links = getA($, current_url);
        semi_results.push(links);

        // if its the first iteration, the next regular images is going to be from the next level of urls
        if (j == 0) {
          const results = getImages($, current_url, i + 1)
          images.push(results);
        }
      } catch (e) {
        console.log(`error processing url: , error : ${e.message}`);
      }
    }
    Object.values(semi_results).forEach(async element => {
      try {
        const res_images = await request(element);
        const sub_html = await res_images.text();
        const chee = cheerio.load(sub_html);
        const results = getImages(chee, element, i + 2);
        images.push(results);
      } catch (e) {
        console.log(`error: ${e.message}`)
      }
    })
  }
  try {
    fs.writeFile('result.json', JSON.stringify(images), (message) => {
      console.log(`succuess: ${message}`)
    });
  } catch (e) {
    console.log(`error in writing the file: ${e.message}`)
  }
}

const getA = ($, current_url) => {
  const semi_results = [];
  $('a').each((n, a) => {
    if (a.attribs.href) {
      const value = a.attribs.href.substring(0, 4) == 'http' | a.attribs.href.substring(0, 3) == 'www' ? a.attribs.href : `${current_url}${a.attribs.href}`;
      semi_results.push(value);
    }
  })
  return semi_results;
}

const getImages = ($, current_url, i) => {
  const images = [];
  $('img').each((y, img) => {
    if (img.attribs.src) {
      images.push({
        imageUrl: img.attribs.src,
        sourceUrl: current_url,
        depth: i
      })
    }
  })
  return images;
}


const request = async (data) => {
  const headers = {
    method: "GET",
    headers: {
      "Accept": "	text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
      "Device-Memory": "8",
      "Downlink": "10",
      "Dpr": "1"
    }
  }
  const req = await fetch(data, headers);

  return req;
}


main();