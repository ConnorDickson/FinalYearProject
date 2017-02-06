using System.Net;
using System.Net.Http;
using DataCentreWebServer.Helpers;
using System.Threading.Tasks;

namespace DataCentreWebServer.RequestHandlers
{
    public class MachineLearningHandler
    {
        private MachineLearningHelper _machineLearningHelper;
        private FileSystemHelper _fileSystemHelper;

        public MachineLearningHandler(MachineLearningHelper machineLearningHelper, FileSystemHelper fileSystemHelper)
        {
            _machineLearningHelper = machineLearningHelper;
            _fileSystemHelper = fileSystemHelper;
        }

        public async Task<HttpResponseMessage> GenerateHttpResponse(HttpRequestMessage request)
        {
            await _fileSystemHelper.WriteMachineLearningAnswerToDisk(request);
            var prevResults = _fileSystemHelper.ReadPreviousMachineLearningAnswers();

            var machineLearningResponse = _machineLearningHelper.GenerateResponse(prevResults);
            var response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("Machine learning from the Data Centre: " + machineLearningResponse);
            return response;
        }
    }
}