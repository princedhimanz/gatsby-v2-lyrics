var fs = require("fs");
var fetch = require("node-fetch");
var cheerio = require("cheerio");
var parser = require("fast-xml-parser");
const { render } = require("mustache");

const template = `---
path: "/{{path}}"
cover: "./images/{{path}}.jpg"
date: "2020-02-01"
title: "{{title}}"
tags: ['punjabi', 'song']
published: truea
---
{{content}}`;

const getHtml = async siteMapUrl => {
  let res = await fetch(siteMapUrl);
  return await res.text();
};

const getUrls = async () => {
  try {
    let url = "https://www.lyricsbell.com/post-sitemap4.xml";
    let html = await getHtml(url);
    let jsonObj = parser.parse(html);
    let urls = jsonObj.urlset.url.map(i => i.loc);
    return urls;
  } catch (err) {
    console.log(err);
  }
};

const scrapData = async html => {
  let $ = cheerio.load(html);
  let title = $("header > h1.entry-title").text();
  let image = $(".lyrics-col img")
    .first()
    .attr("src");
  let content = $(".lyrics-col")
    .last()
    .text();

  if (!title) return false;
  let path = title.replace(/ /g, "-");

  return { title, path, image, content };
};

const saveFile = async data => {
  console.log("writing file");
  let output = render(template, data);
  let path = `./posts/${data.path}.md`;
  fs.writeFileSync(path, output);
  //console.log(content);z
};

const downloadImg = async (url, name) => {
  let res = await fetch(url);
  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(`./posts/images/${name}.jpg`);
    res.body.pipe(dest);
    res.body.on("end", () => resolve("it worked"));
    dest.on("error", reject);
  })
}
//create a server object:
async function start(req, res) {
    console.log("server");
    let urls = await getUrls();
    for await (const [index,url] of urls.entries()) {
      console.log(index)
      let html = await getHtml(url);
      let data = await scrapData(html);
      if (data){
        await downloadImg(data.image, data.path);
        await saveFile(data);
      }
    }
}
start();
