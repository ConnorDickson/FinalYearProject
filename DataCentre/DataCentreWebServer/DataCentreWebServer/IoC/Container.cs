﻿using DataCentreWebServer.RequestHandlers;

namespace DataCentreWebServer.IoC
{
    public static class Container
    {
        public static PythonRequestHandler ResolvePythonRequestHandler()
        {
            return new PythonRequestHandler();
        }
    }
}