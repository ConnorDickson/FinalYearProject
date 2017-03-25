﻿using DataCentreWebServer.IoC;
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
        
        public async Task<HttpResponseMessage> WatchRandomMovie()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.WatchRandomMovie(Request);
        }

        public async Task<HttpResponseMessage> WatchMovie()
        {
            var machineLearningHandler = Container.ResolveMachineLearningHandler();

            return await machineLearningHandler.WatchMovie(Request);
        }
    }
}
