using System;
using DataCentreWebServer.Helpers;
using DataCentreWebServer.RequestHandlers;

namespace DataCentreWebServer.IoC
{
    public static class Container
    {
        public static PythonRequestHandler ResolvePythonRequestHandler()
        {
            return new PythonRequestHandler();
        }

        public static VoiceRecognitionHandler ResolveVoiceRecognitionHandler()
        {
            return new VoiceRecognitionHandler(ResolveFileSystemHelper(), ResolveVoiceRecognitionHelper());
        }

        public static MachineLearningHandler ResolveMachineLearningHandler()
        {
            return new MachineLearningHandler(ResolveMachineLearningHelper());
        }

        private static MachineLearningHelper ResolveMachineLearningHelper()
        {
            return new MachineLearningHelper();
        }

        private static VoiceRecognitionHelper ResolveVoiceRecognitionHelper()
        {
            return new VoiceRecognitionHelper();
        }

        private static FileSystemHelper ResolveFileSystemHelper()
        {
            return new FileSystemHelper();
        }
    }
}