using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace DataCentreWebServer.Helpers
{
    public class FileSystemHelper
    {
        public async Task<bool> WriteFileToDisk(HttpRequestMessage request, string filePath)
        {
            var provider = await request.Content.ReadAsMultipartAsync(new InMemoryMultipartFormDataStreamProvider());

            if(provider == null)
            {
                LoggerHelper.Log("Provider was null");
                return false;
            }

            var files = provider.Files;

            if(files == null || files.Count == 0)
            {
                LoggerHelper.Log("No files in request");
                return false;
            }

            var firstFile = files[0];
            var fileStream = await firstFile.ReadAsStreamAsync();

            using (var fs = File.Create(filePath))
            {
                var bytesInStream = new byte[fileStream.Length];
                fileStream.Read(bytesInStream, 0, bytesInStream.Length);
                fs.Write(bytesInStream, 0, bytesInStream.Length);
            }

            return true;
        }

        public bool WriteMachineLearningAnswerToDisk(string currentChoice)
        {
            var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
            var filePath = rootPath + "\\MachineLearning\\CurrentResults.txt";

            if (!File.Exists(filePath))
            {
                using (File.Create(filePath))
                {

                }
            }

            File.AppendAllText(filePath, currentChoice + Environment.NewLine);

            return true;
        }

        internal List<string> ReadPreviousMachineLearningAnswers()
        {
            var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
            var filePath = rootPath + "\\MachineLearning\\CurrentResults.txt";

            if (!File.Exists(filePath))
            {
                return null;
            }

            var lines = File.ReadAllLines(filePath);
            
            return lines.ToList();
        }

        internal bool DeleteFile(string filePath)
        {
            try
            {
                File.Delete(filePath);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}