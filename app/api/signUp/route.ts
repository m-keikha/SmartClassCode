import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db'; // نام را به connectDB تغییر دادیم چون خروجی فایل شما این است
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB(); // اتصال به دیتابیس

    const newUserSignUp = await request.json();

    // دسترسی به دیتابیس و کالکشن از طریق mongoose
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not found");
    
    const collection = db.collection("TEACHERS_INFORMATION");

    // چک کردن وجود کاربر
    const existingUser = await collection.findOne({ email: newUserSignUp.email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'این ایمیل قبلا ثبت نام شده است' });
    }

    const finallNewUser = {
      ...newUserSignUp,
      xp: 0,
      coins: 0,
      level: 0,
      darkMode: false,
      lastActive: new Date(),
    };

    const result = await collection.insertOne(finallNewUser);

    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ message: "خطا در سرور", error: error.message }, { status: 500 });
  }
}