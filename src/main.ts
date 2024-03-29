import "../global.d";
import "./style/main.css";
import Apps from "@/Apps";
import { createApp } from "@root/render";
import { makeRouter, page } from "@root/plugin/router";
// route
import Index from "./route/Index";
import PageExample from "./route/Page";
import NotFound from "./route/404";

const app = new createApp(Apps, {
    dev: import.meta.env.DEV,
});
app.use(
    makeRouter("#route", {
        url: [
            page("/", Index),
            page("/page", PageExample),
            page("/page/:id", PageExample),
            page("", NotFound)
        ],
    })
);
app.mount();
