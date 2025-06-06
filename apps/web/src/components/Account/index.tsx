import NewPost from "@/components/Composer/NewPost";
import Custom404 from "@/components/Shared/404";
import Custom500 from "@/components/Shared/500";
import Cover from "@/components/Shared/Cover";
import { PageLayout } from "@/components/Shared/PageLayout";
import { EmptyState } from "@/components/Shared/UI";
import { hono } from "@/helpers/fetcher";
import {
  getBlockedByMeMessage,
  getBlockedMeMessage
} from "@/helpers/getBlockedMessage";
import isFeatureEnabled from "@/helpers/isFeatureEnabled";
import { useAccountLinkStore } from "@/store/non-persisted/navigation/useAccountLinkStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { STATIC_IMAGES_URL } from "@hey/data/constants";
import { AccountFeedType } from "@hey/data/enums";
import { Features } from "@hey/data/features";
import getAccount from "@hey/helpers/getAccount";
import isAccountDeleted from "@hey/helpers/isAccountDeleted";
import { useAccountQuery } from "@hey/indexer";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";
import AccountFeed from "./AccountFeed";
import DeletedDetails from "./DeletedDetails";
import Details from "./Details";
import FeedType from "./FeedType";
import AccountPageShimmer from "./Shimmer";
import SuspendedDetails from "./SuspendedDetails";

const ViewAccount = () => {
  const { address, username } = useParams<{
    address: string;
    username: string;
  }>();
  const [feedType, setFeedType] = useState<AccountFeedType>(
    AccountFeedType.Feed
  );

  const { currentAccount } = useAccountStore();
  const { cachedAccount, setCachedAccount } = useAccountLinkStore();
  const isStaff = isFeatureEnabled(Features.Staff);

  const { data, error, loading } = useAccountQuery({
    skip: address ? !address : !username,
    variables: {
      request: {
        ...(address
          ? { address }
          : { username: { localName: username as string } })
      }
    },
    onCompleted: (data) => {
      if (data?.account) {
        setCachedAccount(null);
      }
    }
  });

  const account = data?.account ?? cachedAccount;

  const { data: accountDetails, isLoading: accountDetailsLoading } = useQuery({
    queryKey: ["account", account?.address],
    queryFn: () => hono.account.get(account?.address),
    enabled: Boolean(account?.address)
  });

  if ((!username && !address) || (loading && !cachedAccount)) {
    return <AccountPageShimmer />;
  }

  if (!account) {
    return <Custom404 />;
  }

  if (error) {
    return <Custom500 />;
  }

  const isSuspended = isStaff ? false : accountDetails?.isSuspended;
  const isDeleted = isAccountDeleted(account);
  const isBlockedByMe = account?.operations?.isBlockedByMe;
  const hasBlockedMe = account?.operations?.hasBlockedMe;

  const renderAccountDetails = () => {
    if (isDeleted) return <DeletedDetails account={account} />;
    if (isSuspended) return <SuspendedDetails account={account} />;

    return (
      <Details
        isSuspended={accountDetails?.isSuspended || false}
        isBlockedByMe={account?.operations?.isBlockedByMe || false}
        hasBlockedMe={account?.operations?.hasBlockedMe || false}
        account={account}
      />
    );
  };

  const renderEmptyState = () => {
    const message = isDeleted
      ? "Account Deleted"
      : isSuspended
        ? "Account Suspended"
        : isBlockedByMe
          ? getBlockedByMeMessage(account)
          : hasBlockedMe
            ? getBlockedMeMessage(account)
            : null;

    return (
      <EmptyState
        icon={<NoSymbolIcon className="size-8" />}
        message={message}
      />
    );
  };

  return (
    <PageLayout
      title={`${getAccount(account).name} (${getAccount(account).usernameWithPrefix}) • Hey`}
      zeroTopMargin
    >
      <Cover
        cover={
          isSuspended
            ? `${STATIC_IMAGES_URL}/patterns/2.svg`
            : account?.metadata?.coverPicture ||
              `${STATIC_IMAGES_URL}/patterns/2.svg`
        }
      />
      {renderAccountDetails()}
      {isDeleted || isSuspended || isBlockedByMe || hasBlockedMe ? (
        renderEmptyState()
      ) : (
        <>
          <FeedType feedType={feedType} setFeedType={setFeedType} />
          {currentAccount?.address === account?.address && <NewPost />}
          {(feedType === AccountFeedType.Feed ||
            feedType === AccountFeedType.Replies ||
            feedType === AccountFeedType.Media ||
            feedType === AccountFeedType.Collects) && (
            <AccountFeed
              username={getAccount(account).usernameWithPrefix}
              accountDetailsLoading={accountDetailsLoading}
              address={account.address}
              type={feedType}
            />
          )}
        </>
      )}
    </PageLayout>
  );
};

export default ViewAccount;
