import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db"; 
import mongoose from "mongoose";

interface User {
    email: string;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("دیتابیس در دسترس نیست");
        }

        const collection = db.collection("TEACHERS_INFORMATION");

        const body: User = await request.json();
        
        if (!body.email) {
            return NextResponse.json({ success: false, message: "ایمیل وارد نشده است" }, { status: 400 });
        }

        console.log("Checking email:", body.email);

        const user = await collection.findOne({ email: body.email.toLowerCase() });

        if (user) {
            return NextResponse.json({ 
                success: false, 
                exist: true, 
                message: 'این ایمیل قبلاً ثبت نام شده است، لطفا از صفحه لاگین اقدام کنید' 
            });
        }

        return NextResponse.json({ 
            success: true, 
            exist: false, 
            message: 'ایمیل با موفقیت بررسی شد و آزاد است.' 
        });

    } catch (error) {
        console.error("Detailed error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json({
            message: "خطا در اتصال به پایگاه داده",
            error: errorMessage
        }, { status: 500 });
    }
}