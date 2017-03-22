using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class MachineLearningController : ApiController
    {

        public HttpResponseMessage GetMovies()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return machineLearningHandler.ReturnMovies(Request);
        }

        [HttpPost]
        public async Task<HttpResponseMessage> GetPreviousMovies()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.ReturnPreviousMovies(Request);
        }

        public async Task<HttpResponseMessage> StoreResult()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.StoreUserResult(Request);
        }

        //[HttpPost]
        public async Task<HttpResponseMessage> WatchRandomMovie()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.WatchRandomMovie(Request);
        }
    }
}
