using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

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
    }
}