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