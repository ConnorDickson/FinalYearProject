using DataCentreWebServer.Helpers;
using DataCentreWebServer.MachineLearning;
using DataCentreWebServer.RequestHandlers;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace DataCentreWebServer.UnitTests.RequestHandlers
{
    [TestClass]
    public class MachineLearningHandlerTests
    {
        [TestMethod]
        public void MachineLearningHandler_CanInit()
        {
            var movieParser = new MovieParser();
            var machineLearningHelper = new MachineLearningHelper(movieParser);
            var machineLearningFileHandler = new MachineLearningFileHandler();
            var machineLearningHandler = new MachineLearningHandler(machineLearningHelper, machineLearningFileHandler);

            machineLearningHandler.ReturnMovies(null);
        }
    }
}
