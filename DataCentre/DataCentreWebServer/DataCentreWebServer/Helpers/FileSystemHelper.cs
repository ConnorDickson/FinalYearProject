using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace DataCentreWebServer.Helpers
{
    //used to deal with files on disk
    public class FileSystemHelper
    {
        /// <summary>
        /// store the data in the request to filepath provided
        /// </summary>
        /// <param name="request"></param>
        /// <param name="filePath"></param>
        /// <returns></returns>
        public async Task<bool> WriteFileToDisk(HttpRequestMessage request, string filePath)
        {
            // get files from request
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

            // read the request file and write to the local disk
            using (var fs = File.Create(filePath))
            {
                var bytesInStream = new byte[fileStream.Length];
                fileStream.Read(bytesInStream, 0, bytesInStream.Length);
                fs.Write(bytesInStream, 0, bytesInStream.Length);
            }

            return true;
        }

        /// <summary>
        /// Delete the file at the filePath if it exists
        /// </summary>
        /// <param name="filePath"></param>
        /// <returns></returns>
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