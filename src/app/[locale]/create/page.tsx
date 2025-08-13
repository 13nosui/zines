import { serverAuthGuard } from "@/lib/auth/server-guards";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create - Protected Route",
  description: "Create something new",
};

export default async function CreatePage() {
  // This will automatically redirect to sign-in if not authenticated
  const session = await serverAuthGuard({ returnTo: "/create" });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Create Page
          </h1>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h2 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Authenticated User
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Email: {session.user?.email}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              User ID: {session.user?.id}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Something New
            </h2>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter a title..."
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter your content..."
                />
              </div>

              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
