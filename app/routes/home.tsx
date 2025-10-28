import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [wiping, setWiping] = useState(false);

  // lấy danh sách "resume metadata" từ kho KV (key-value),
  // chuyển giá trị JSON thành các object Resume, và cập nhật state của component
  // để giao diện hiển thị danh sách này. Nói cách khác: hàm này chịu trách nhiệm nạp dữ liệu resume (metadata)
  // khi trang Home được mở hoặc sau khi có thay đổi (ví dụ sau khi wipe).
  const loadResumes = async () => {
    setLoadingResumes(true);

    const resumes = (await kv.list("resume:*", true)) as KVItem[];

    const parsedResumes = resumes?.map(
      (resume) => JSON.parse(resume.value) as Resume
    );

    setResumes(parsedResumes || []);
    setLoadingResumes(false);
  };

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated]);

  useEffect(() => {
    loadResumes();
  }, []);

  const handleWipe = async () => {
    if (
      !confirm(
        "This will delete all uploaded files and resume data. Are you sure?"
      )
    )
      return;
    try {
      setWiping(true);

      const files = (await fs.readDir("./")) as FSItem[];
      for (const file of files) {
        try {
          await fs.delete(file.path);
        } catch (e) {}
      }

      await kv.flush();

      // reload resumes list
      await loadResumes();

      alert("Wipe complete.");
    } catch (e) {
      alert("Wipe failed. See console for details.");
    } finally {
      setWiping(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
          {/* Show Wipe button when we have at least one resume */}
          {!loadingResumes && resumes?.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => handleWipe()}
                disabled={wiping}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-300 ${
                  wiping
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 cursor-pointer"
                }`}
              >
                {wiping ? "Wiping..." : "Wipe All Data"}
              </button>
            </div>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4">
            <Link
              to="/upload"
              className="primary-button w-fit text-xl font-semibold"
            >
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
