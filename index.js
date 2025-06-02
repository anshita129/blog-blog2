import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override"
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static("public")); // For static files like CSS (optional)
app.set("view engine", "ejs");

// Ensure the "blog" folder exists
const blogDir = "./blog";

if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir);
}

app.get("/", (req, res) => {
  // Read all blog files and render them
  const blogFiles = fs.readdirSync(blogDir);
  const blogs = blogFiles.map(filename => {
    const content = fs.readFileSync(path.join(blogDir, filename), "utf-8");
    const [title, ...bodyLines] = content.split("\n");
    return {
      title: title.trim(),
      content: bodyLines.join("\n").trim(),
      filename: filename
    };
  });
  res.render("index.ejs", { blogs });
});

app.post("/submit", (req, res) => {
  const title = req.body["title"];
  const content = req.body["writingbox"];

  // Create a safe filename
  const timestamp = Date.now();
  const fileName = `${timestamp}-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

  const fullContent = `${title}\n${content}`;
  fs.writeFileSync(path.join(blogDir, fileName), fullContent);

  res.redirect("/");
});
app.get("/blogs/:filename/edit", (req, res) => {
  const filePath = path.join(blogDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const [title, ...rest] = content.split("\n");
    const body = rest.join("\n");

    res.render("edit.ejs", {
      filename: req.params.filename,
      title: title,
      content: body
    });
  } else {
    res.status(404).send("Blog post not found.");
  }
});

app.put("/blogs/:filename", (req, res) => {
  const filePath = path.join(blogDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    const newContent = `${req.body.title}\n${req.body.content}`;
    fs.writeFileSync(filePath, newContent);
    res.redirect("/");
  } else {
    res.status(404).send("Blog post not found.");
  }
});

app.delete("/blogs/:filename", (req, res) => {
  const filePath = path.join(blogDir, req.params.filename);
  console.log("Attempting to delete:", req.params.filename);
  console.log("Full path:", filePath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  } else {
    console.log("File not found:", filePath);
  }

  res.redirect("/");
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
