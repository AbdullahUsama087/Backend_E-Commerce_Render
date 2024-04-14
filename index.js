import express from "express";

import path from "path";
import { config } from "dotenv";
config({ path: path.resolve("./Config/config.env") });

import intiateApp from "./Src/Utils/intiateApp.js";

const app = express();

intiateApp(app, express);
