using DataCentreWebServer.MachineLearning;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace DataCentreWebServer.UnitTests.RequestHandlers
{
    [TestClass]
    public class MachineLearningHandlerTests
    {
        [TestMethod]
        public void MachineLearningHandler_CanInit()
        {
            var machineLearningFileHandler = new MachineLearningFileHandler();
            //This doesn't work
            var lines = machineLearningFileHandler.GetMovieLinesFromDisk();

            var movieParser = new MovieParser();
            var movies = movieParser.ParseMovies(lines);

            KMeansHelper kmeansHelper = new KMeansHelper();
            var clusteredMoviesResults = kmeansHelper.kmeans(movies, 10000);
        }
    }
}
