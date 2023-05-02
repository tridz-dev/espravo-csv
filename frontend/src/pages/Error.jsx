import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconFileSpreadsheet } from "@tabler/icons";
import Title from "../components/global/page/title";
const API_URL = "https://csv-be.tridz.in"
const ErrorPage = () => {
    return (
        <main className="flex w-full flex-1 flex-col overflow-hidden">
            <div className="grid items-start gap-8">
                {/* title + button */}
                <Title title="Error 404" subtitle="Page Not Found" />
                {/* title + button */}
            </div>
        </main>
    );
}
export default ErrorPage;