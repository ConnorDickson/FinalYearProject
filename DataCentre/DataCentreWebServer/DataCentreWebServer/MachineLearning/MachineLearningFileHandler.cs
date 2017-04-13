using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Web;

namespace DataCentreWebServer.MachineLearning
{
    //this class handles all operations machine learning needs to perform with the file system
    public class MachineLearningFileHandler
    {
        //This would ideally all be done with a database rather than storing it in a file on disk.

        ReaderWriterLockSlim _readerWriterLockUserData = new ReaderWriterLockSlim();
        ReaderWriterLockSlim _readerWriterLockClusterData = new ReaderWriterLockSlim();

        /// <summary>
        /// Returns raw movie lines from the file on disk
        /// </summary>
        /// <returns></returns>
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

        /// <summary>
        /// Returns movies that the were watched by the user with the UserID passed into the method
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public string[] GetUserMovies(string userID)
        {
            _readerWriterLockUserData.EnterReadLock();

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
                    var savedUserName = line.Substring(0, userID.Length).Trim();
                    
                    // if this is not the users line continue
                    if (savedUserName.Trim() != userID)
                    {
                        continue;
                    }

                    // need to get list of all movie ID's and get vectors
                    var movieIDLine = line.Substring(userID.Length);

                    // get all the movies this user has watched
                    var allUserMovieIDs = movieIDLine.Split(' ');
                    
                    var allMovieLines = GetMovieLinesFromDisk();

                    var completedUserMovies = new List<string>();
                    
                    // once we have all the movie ID's that the user watched we need to parse though 
                    // all the movies to find the rest of the movie data so we can return a movie object
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
                _readerWriterLockUserData.ExitReadLock();
            }

            return null;
        }

        /// <summary>
        /// Take the movie that the user watched and store the fact the user watched this movie
        /// </summary>
        /// <param name="movie"></param>
        /// <param name="userID"></param>
        public void StoreUserResult(Movie movie, string userID)
        {
            _readerWriterLockUserData.EnterWriteLock();

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
                _readerWriterLockUserData.ExitWriteLock();
            }
        }

        internal void WriteClusteredSubset(Movie[] movieClusterSubset)
        {
            _readerWriterLockClusterData.EnterWriteLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                //Store result into the users results (currentResults.txt)
                var filePath = rootPath + Constants.MachineLearning.ClusterDataFile;

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

                using (File.Create(filePath)) { }

                var lines = new List<string>();

                foreach(var movie in movieClusterSubset)
                {
                    string movieInfo = movie.ID + " " +
                                movie.Title + " " +
                                movie.Year.ToString() + " " +
                                movie.PercentageHorror + " " +
                                movie.PercentageComedy + " " +
                                movie.PercentageAction + " " +
                                movie.PercentageAdventure + " " +
                                movie.PercentageFantasy + " " +
                                movie.PercentageRomance + " " +
                                movie.ContainsViolence + " " +
                                movie.ContainsSexualScenes + " " +
                                movie.ContainsDrugUse + " " +
                                movie.ContainsFlashingImages;

                    lines.Add(movieInfo);    
                }

                File.AppendAllLines(filePath, lines);
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An exception occurred while storing cluster data: " + ex.Message + ex.Message);
            }
            finally
            {
                _readerWriterLockClusterData.ExitWriteLock();
            }
        }

        internal string[] ReadMovieClusterSubset()
        {
            _readerWriterLockClusterData.EnterReadLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + Constants.MachineLearning.ClusterDataFile;

                if(!File.Exists(filePath))
                {
                    return null;
                }

                var lines = File.ReadAllLines(filePath);
                return lines;
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An exception occurred while getting user movies: " + ex.Message + ex.Message);
            }
            finally
            {
                _readerWriterLockClusterData.ExitReadLock();
            }

            return null;
        }
    }
}