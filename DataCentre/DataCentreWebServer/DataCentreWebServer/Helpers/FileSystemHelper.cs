using DataCentreWebServer.MachineLearning;
using Newtonsoft.Json;
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
        public async Task WriteFileToDisk(HttpRequestMessage request, string filePath)
        {
            var requestStream = await request.Content.ReadAsStreamAsync();

            using (var fs = File.Create(filePath))
            {
                var bytesInStream = new byte[requestStream.Length];
                requestStream.Read(bytesInStream, 0, bytesInStream.Length);
                fs.Write(bytesInStream, 0, bytesInStream.Length);
            }
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
    }
}