using DataCentreWebServer.IoC;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace DataCentreWebServer.Controllers
{
    public class MachineLearningController : ApiController
    {
        /// <summary>
        /// Used to return movies to the Edge node when they request
        /// </summary>
        /// <returns></returns>
        public HttpResponseMessage GetMovies()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return machineLearningHandler.ReturnMovies(Request);
        }

        /// <summary>
        /// Returns a list of movies previously watched by the requesting user
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<HttpResponseMessage> GetPreviousMovies()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.ReturnPreviousMovies(Request);
        }
        
        /// <summary>
        /// Watches a random one of the movies available on disk
        /// </summary>
        /// <returns></returns>
        public async Task<HttpResponseMessage> WatchRandomMovie()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.WatchRandomMovie(Request);
        }

        /// <summary>
        /// Watches a specific movie 
        /// </summary>
        /// <returns></returns>
        public async Task<HttpResponseMessage> WatchMovie()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.WatchMovie(Request);
        }
    }
}
