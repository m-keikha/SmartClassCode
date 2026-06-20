// این کامپوننت رو برای استفاده در پیج استیودنت ساختمش 
import { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/utils/cn';
interface IProps {
    title: string;
    titleSvg: LucideIcon
    children: React.ReactNode
    className?:string
}

export default function StContainer({ title, titleSvg: Icon, children , className}: IProps) {
    return (
        <div className={cn(`bg-white p-5 w-full mt-6 rounded-3xl shadow-sm border border-gray-100 h-auto min-h-[150px]` ,  className)}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                <Icon className="w-6 h-6 ml-2 text-blue-500" />
                {title}
            </h3>

            {children}
        </div>
    )
}
