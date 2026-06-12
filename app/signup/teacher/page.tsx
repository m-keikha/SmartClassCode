'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import Link from "next/link"; // برای دکمه بازگشت

// import EmailVerify from '@/components/EmailVerify'
import { useRouter } from 'next/navigation'
import { Loader2 , ArrowRight} from 'lucide-react'
import {
    addClass, checkExistingUser, loginTeacher
} from '../../actions';

export interface UserSignUp {
    name: string;
    gender: string;
    email: string,
    password: string,
    className: string
    confirmPassword: string
}




export default function SignUp() {
    const router = useRouter()
    const schema = yup.object().shape({
        name: yup.string().required('وارد کردن نام ضروریست'),
        className: yup.string(),
        email: yup.string().email('ایمیل وارد شده نامعتبر است').required('وارد کردن ایمیل ضروریست'),
        password: yup.string().min(8, "رمز عبور باید حداقل 8 کاراکتر باشد").max(30).required('وارد کردن رمزعبور ضروریست').matches(/[a-z]+/, "رمز عبور باید شامل ترکیبی از عدد و حروف انگلیسی باشد").matches(/\d+/, "رمز عبور باید شامل ترکیبی از عدد و حروف انگلیسی باشد"),
        // password: yup.string().min(8, "رمز عبور باید حداقل 8 کاراکتر باشد").max(30).required('وارد کردن رمزعبور ضروریست').matches(/[a-z]+/, "رمز عبور باید شامل ترکیبی از عدد و حروف کوچک و بزرگ انگلیسی باشد").matches(/[A-Z]+/, "رمز عبور باید شامل ترکیبی از عدد و حروف کوچک و بزرگ انگلیسی باشد").matches(/\d+/, "رمز عبور باید شامل ترکیبی از عدد و حروف کوچک و بزرگ انگلیسی باشد"),
        confirmPassword: yup.string().oneOf([yup.ref("password")], "رمز عبور یکسان نیست").required('وارد کردن تکرار رمزعبور ضروریست'),
    })
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) })

    const [isSuccessSendOtb, setIsSuccessSendOtb] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [error, setError] = useState('')


    const onHandleSubmit = async (data: UserSignUp) => {
        if (isSubmitting) {
            console.log('در حال ارسال...')
            return
        }
        setIsSubmitting(true)
        let isSuccessOtp = false
        console.log(data)


        try {
            // const response = await fetch('/api/check-email', {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({ email: data.email })
            // })
            // const result = await response.json();

            // if (result.exist) {
            //     alert(result.message)
            //     return
            // }



            const dataSignUp = {
                className: data.className,
                teacherName: data.name,
                password: data.password,
                userName: data.email,
                role: 'teacher'
            }

            const existingUser = await checkExistingUser(data.email)
            if (existingUser.success === false) {
                setError(existingUser?.error)
                return
            }

            const res = await addClass(dataSignUp)


            if (res.success) {
                console.log('ثبت نام با موفقیت انجام شد ' + res)

                const loginResult = await loginTeacher(data.email, data.password)

                if (loginResult.success) {
                    localStorage.setItem('login-data', loginResult.classId.toString())
                    localStorage.setItem('user_role', 'teacher');

                    window.location.href = '/teacher'
                }

                alert('✅ ثبت نام با موفقیت انجام شد!')
                // router.push('/dashboard') // به صفحه مورد نظر بروید

            } else {
                const errorMessage = 'خطا در ثبت نام'
                setError(errorMessage)
                alert('❌ ' + errorMessage)

            }







            // const signUpResponse = await fetch('/api/signUp', {
            //     method: "POST",
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(data)
            // });

            // if (!signUpResponse.ok) {
            //     throw new Error(`خطای HTTP در ثبت نام: ${signUpResponse.status}`);
            // }

            // const signUpResult = await signUpResponse.json();
            // console.log('📥 پاسخ signUp:', signUpResult);

            // if (!signUpResult.success) {
            //     console.error('❌ خطا در ثبت نام:', signUpResult.message);
            //     setError(`خطا در ثبت نام: ${signUpResult.message || 'خطای ناشناخته'}`);
            //     setIsLoading(false);
            //     return;
            // }

            console.log('✅ ثبت نام موفقیت‌آمیز');

        } catch {
            console.log('خطای غیرمنتظره ' + error)
        } finally {
            setIsSubmitting(false)

        }


        // const verifyEmail = await EmailVerify(data.email)

        // if (verifyEmail.error) {
        //     console.log(verifyEmail.error)
        // }
        // if (verifyEmail.result) {
        //     console.log(verifyEmail.result)
        //     isSuccessOtp = true
        // setIsSuccessSendOtb(true)


        // localStorage.setItem('userSignUpData', JSON.stringify(data))
        // if (isSuccessOtp) {
        //     alert('کد به سرور ارسال شد !')
        //     router.push(`/auth/signup/email-verify?email=${data.email}`)
        // }
    }


// ... کدهای کامپوننت و لاجیک شما ...

return (
  <div className="min-h-screen bg-[url('/nature.jpg')] bg-cover bg-center bg-fixed relative flex items-center justify-center p-4 sm:p-8" dir="rtl">
    {/* لایه تیره پس‌زمینه */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    {/* کارت اصلی */}
    <div className="relative z-10 bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-300 overflow-hidden">
      
      {/* هدر رنگی بالای فرم */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-center relative">
        <Link 
          href="/" // مسیر صفحه لاگین رو اینجا بگذار
          className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-extrabold text-white mb-2 shadow-sm">ثبت نام همکار</h1>
        <p className="text-emerald-50 text-sm">برای پیوستن به سامانه اطلاعات خود را وارد کنید</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit(onHandleSubmit)} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* نام و نام خانوادگی */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نام و نام خانوادگی</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all ${errors.name ? 'border-red-400 focus:ring-2 focus:ring-red-500/50' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                placeholder="مثال: علی محمدی" 
                {...register('name')} 
              />
              {errors.name && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.name.message}</p>}
            </div>

            {/* نام کلاس */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نام کلاس</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all ${errors.className ? 'border-red-400 focus:ring-2 focus:ring-red-500/50' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                placeholder="مثال: پایه دهم الف" 
                {...register('className')} 
              />
              {errors.className && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.className.message}</p>}
            </div>
          </div>

          {/* ایمیل */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ایمیل</label>
            <input 
              type="email" 
              className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-500/50' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
              placeholder="example@mail.com" 
              dir="ltr"
              {...register('email')} 
            />
            {errors.email && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.email.message}</p>}
          </div>

          {/* رمز عبور */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رمز عبور</label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-500/50' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                placeholder="********" 
                dir="ltr"
                {...register('password')} 
              />
              {errors.password && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.password.message}</p>}
            </div>

            {/* تکرار رمز عبور */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">تکرار رمز عبور</label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all ${errors.confirmPassword ? 'border-red-400 focus:ring-2 focus:ring-red-500/50' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                placeholder="********" 
                dir="ltr"
                {...register('confirmPassword')} 
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* ارور کلی فرم */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <span>{error}</span>
            </div>
          )}

          {/* دکمه ارسال */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex items-center justify-center gap-2 mt-8 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-[0.98] text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'در حال ایجاد حساب...' : 'ثبت نام در سامانه'}</span>
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              // آیکون فلش برای زیبایی که موقع هاور حرکت میکنه
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            )}
          </button>

        </form>
      </div>
    </div>
  </div>
);}
