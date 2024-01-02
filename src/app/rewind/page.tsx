import { authOptions } from '@/utils/auth'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import {
  getLibrariesTotalDuration,
  getRequestsTotals,
  getTopMediaItems,
  getTopMediaStats,
  getUserRequestsTotal,
  getUserTotalDuration,
  getlibrariesTotalSize,
} from '@/utils/getRewind'
import { ExtendedUser, UserRewind } from '@/utils/types'
import { Session, getServerSession } from 'next-auth'
import RewindStories from './_components/RewindStories'

export default async function Rewind() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const libraries = await getLibraries()
  const [
    topMediaItems,
    topMediaStats,
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    serverId,
  ] = await Promise.all([
    getTopMediaItems(session.user.id, libraries),
    getTopMediaStats(session.user.id, libraries),
    getUserTotalDuration(session.user.id, libraries),
    getlibrariesTotalSize(libraries),
    getLibrariesTotalDuration(libraries),
    getServerId(),
  ])
  const totalDurationPercentage = `${Math.round(
    (userTotalDuration * 100) / librariesTotalDuration,
  )}%`
  const userRewind: UserRewind = {
    total_duration: secondsToTime(userTotalDuration),
    total_duration_percentage: totalDurationPercentage,
    libraries: libraries,
    libraries_total_size: librariesTotalSize,
    server_id: serverId,
    shows: {
      top: topMediaItems.shows,
      count: topMediaStats.shows.count,
      duration: topMediaStats.shows.duration,
    },
    movies: {
      top: topMediaItems.movies,
      count: topMediaStats.movies.count,
      duration: topMediaStats.movies.duration,
    },
    audio: {
      top: topMediaItems.audio,
      count: topMediaStats.audio.count,
      duration: topMediaStats.audio.duration,
    },
  }

  if (process.env.NEXT_PUBLIC_OVERSEERR_URL) {
    const [requestTotals, userRequestsTotal] = await Promise.all([
      getRequestsTotals(),
      getUserRequestsTotal(session.user.id),
    ])

    userRewind.requests = requestTotals
    userRewind.user_requests = userRequestsTotal
  }

  return <RewindStories userRewind={userRewind} user={session.user} />
}
