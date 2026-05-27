-- CreateTable
CREATE TABLE "AvatarReward" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "AvatarReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAvatarReward" (
    "userId" TEXT NOT NULL,
    "avatarRewardId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatarReward_pkey" PRIMARY KEY ("userId","avatarRewardId")
);

-- AddForeignKey
ALTER TABLE "UserAvatarReward" ADD CONSTRAINT "UserAvatarReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAvatarReward" ADD CONSTRAINT "UserAvatarReward_avatarRewardId_fkey" FOREIGN KEY ("avatarRewardId") REFERENCES "AvatarReward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
