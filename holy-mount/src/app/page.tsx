import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            Holy Mount
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            专业的英语学习平台，提供个性化学习体验和智能考试系统
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link
              href="/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              开始学习
            </Link>
            <Link
              href="/exam"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-10 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              体验考试
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10 mb-20">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              个性化学习
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              根据您的学习水平和目标，定制专属的学习计划和内容推荐
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              智能测评
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              先进的考试系统，实时评估学习进度，提供详细的能力分析报告
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              快速提升
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              高效的学习方法和丰富的练习题库，帮助您快速提升英语水平
            </p>
          </div>
        </div>

        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-16 shadow-xl">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            开始您的英语学习之旅
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            加入我们，体验最专业的英语学习平台
          </p>
          <Link
            href="/auth/signin"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-lg font-semibold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            立即注册
          </Link>
          </div>
        </div>
      </div>
    </>
  );
}