using DataCentreWebServer.RequestHandlers;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace DataCentreWebServer.UnitTests
{
    [TestClass]
    public class PythonRequestHandlerTests
    {
        [TestMethod]
        public void PythonRequestHandler_CanInit()
        {
            var requestHandler = new PythonRequestHandler();
            Assert.IsNotNull(requestHandler.GenerateHttpResponse());
        }
    }
}
