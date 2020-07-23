"use strict";

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Url = require("./models/Url");
const dns = require("dns");

dotenv.config({ path: "./config/config.env" });

connectDB();

const cors = require("cors");

const app = express();

app.use(cors());

//body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl/new", (req, res) => {
  let theurl = req.body.url;
  const regex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  // const regex = /^https?:\/\/www/;
  if (!regex.test(theurl)) {
    res.json({ error: "invalid URL" });
    return;
  }

  let dnsUrl = theurl;

  if (/^https:\/\/www./.test(dnsUrl)) {
    dnsUrl = dnsUrl.split("https://www.")[1];
  } else if (/^http:\/\/www./.test(dnsUrl)) {
    dnsUrl = dnsUrl.split("http://www.")[1];
  } else if (/^https:\/\//.test(dnsUrl)) {
    dnsUrl = dnsUrl.split("https://")[1];
  } else if (/^http:\/\//.test(dnsUrl)) {
    dnsUrl = dnsUrl.split("http://")[1];
  } else {
    theurl = "http://" + theurl;
  }

  dns.lookup(dnsUrl, async (err, address, family) => {
    if (err) {
      console.error(err);
      res.json({ error: "The domain name does not exist" });
      return;
    }

    let num = Math.floor(Math.random() * 1000);
    let alreadyUsedNumbers = [];
    const newUrl = {
      fullAddress: theurl,
      shortAddressNumber: num,
    };

    try {
      let objects = await Url.find().select("shortAddressNumber").lean();
      for (let i = 0; i < objects.length; i++) {
        alreadyUsedNumbers.push(objects[i].shortAddressNumber);
      }
      while (alreadyUsedNumbers.includes(num)) {
        num = Math.floor(Math.random() * 20);
      }
      await Url.create(newUrl);
      res.json({
        original_url: theurl,
        short_url: num,
      });
    } catch (err) {
      console.error(err);
      res.json({ error: "Server error" });
    }
  });
});

app.get("/api/shorturl/:num", async (req, res) => {
  const number = parseInt(req.params.num);
  try {
    const url = await Url.findOne({ shortAddressNumber: number }).lean();
    if (!url) {
      res.json({ error: "User not found" });
    } else {
      res.setHeader("Content-Type", "text/html");
      res.status(200).redirect(url.fullAddress);
    }
  } catch (err) {
    console.error(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Node.js listening ... on port ${PORT}`);
});
