using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Web;

namespace DataCentreWebServer.MachineLearning
{
    public class MachineLearningFileHandler
    {
        //This would ideally all be done with a database rather than storing it in a file on disk.

        ReaderWriterLockSlim _readerWriterLock = new ReaderWriterLockSlim();

        public string[] GetMovieLinesFromDisk()
        {
            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + Constants.MachineLearning.MovieDataFile;
                var lines = File.ReadAllLines(filePath);
                return lines;
            }
            catch(Exception ex)
            {
                LoggerHelper.Log(ex.Message + "\n" + ex.StackTrace);
            }

            return null;
        }

        public string[] GetUserMovies(string userID)
        {
            _readerWriterLock.EnterReadLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                //Store result into the users results (currentResults.txt)
                var filePath = rootPath + Constants.MachineLearning.UserDataFile;

                if (!File.Exists(filePath))
                {
                    using (File.Create(filePath)) { }
                }

                //1 entry per user with a long list of ID's for each movie they have watched
                var lines = File.ReadAllLines(filePath);

                foreach (var line in lines)
                {
                    //ToDo - make this more robust
                    if (!line.StartsWith(userID))
                    {
                        continue;
                    }
                    //Need to get list of all movie ID's and get vectors
                    var movieIDLine = line.Substring(userID.Length);

                    var allUserMovieIDs = movieIDLine.Split(' ');
                    
                    var allMovieLines = GetMovieLinesFromDisk();

                    var completedUserMovies = new List<string>();
                    
                    foreach (var movieLine in allMovieLines)
                    {
                        var movieID = movieLine.Split(' ')[0];
                        
                        foreach (var userMovieID in allUserMovieIDs)
                        {
                            if (movieID == userMovieID)
                            {
                                completedUserMovies.Add(movieLine);
                            }
                        }
                    }
                    
                    return completedUserMovies.ToArray();
                }
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An exception occurred while getting user movies: " + ex.Message + ex.Message);
            }
            finally
            {
                _readerWriterLock.ExitReadLock();
            }

            return null;
        }

        public void StoreUserResult(Movie movie, string userID)
        {
            _readerWriterLock.EnterWriteLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                //Store result into the users results (currentResults.txt)
                var filePath = rootPath + Constants.MachineLearning.UserDataFile;

                if (!File.Exists(filePath))
                {
                    using (File.Create(filePath)) { }
                }

                //1 entry per user with a long list of ID's for each movie they have watched
                var lines = File.ReadAllLines(filePath);
                bool lineUpdated = false;
                using (var writer = new StreamWriter(filePath))
                {
                    for (int currentLine = 0; currentLine < lines.Length; currentLine++)
                    {
                        var line = lines[currentLine];

                        if (line.StartsWith(userID))
                        {
                            writer.WriteLine(line + " " + movie.ID);
                            lineUpdated = true;
                        }
                        else
                        {
                            writer.WriteLine(line);
                        }
                    }
                }
                
                if(!lineUpdated)
                {
                    File.AppendAllText(filePath, userID + " " + movie.ID);
                }
            }
            catch(Exception ex)
            {
                LoggerHelper.Log("An exception occurred while storing user results: " + ex.Message + ex.Message);
            }
            finally
            {
                _readerWriterLock.ExitWriteLock();
            }
        }
    }
}