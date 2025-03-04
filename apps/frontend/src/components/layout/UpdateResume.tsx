import { useState } from "react";
import { useUser } from "../../context/UserProvder";
import { PropagateLoader } from "react-spinners";

const UpdateResume = () => {
  const { contextResume, setResume } = useUser();
  const [updatedResumeFile, setUpdatedResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUpdatedResumeFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!updatedResumeFile) {
      setError('Please select a resume file');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', updatedResumeFile);
    formData.append('user_id', '86318221-2f8e-43e2-822c-2d76e94b7aad'); // TODO: Get from Clerk

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume`, {
        method: 'POST',
        body: formData
      });

      const resumeResponse = await response.json();

      if (resumeResponse.error) {
        setError(resumeResponse.error);
        return;
      }

      setResume(resumeResponse);
      setUpdatedResumeFile(null);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Resume</h1>
      
      {/* Current Resume Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Current Resume</h2>
        {contextResume ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Last updated: {new Date(contextResume.created_at || new Date()).toLocaleDateString()}
            </p>
            {contextResume.raw_text && (
              <div className="mt-2 text-sm text-gray-700 max-h-32 overflow-y-auto">
                <strong>Preview:</strong>
                <p className="whitespace-pre-wrap">{contextResume.raw_text.slice(0, 1000)}...</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">No resume uploaded yet</p>
        )}
      </div>

      {/* Upload New Resume Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload New Resume</h2>
        <div className="space-y-4">
          <label className="cursor-pointer block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <div className="space-y-2">
              <span className="text-blue-600 hover:text-blue-700">
                Click to upload
              </span>
              <p className="text-sm text-gray-500">
                {updatedResumeFile ? updatedResumeFile.name : 'PDF, DOC, or DOCX (Max 5MB)'}
              </p>
            </div>
          </label>

          <button
            onClick={handleUpload}
            disabled={isLoading || !updatedResumeFile}
            className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <PropagateLoader color="#ffffff" size={10} className="p-3" />
            ) : (
              'Upload Resume'
            )}
          </button>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateResume;