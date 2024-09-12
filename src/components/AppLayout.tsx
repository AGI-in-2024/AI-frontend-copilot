import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "~/utils/utils";
import { Logo } from "./LogoLarge";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { CustomToaster } from "~/components/CustomToaster";
import Head from "next/head";
import Image from "next/image";
import { Navbar, Dropdown } from '@nlmk/ds-2.0/react';

const navigation = [{ name: "My UIs", href: "/my-uis" }];
const userNavigation = [{ name: "Settings", href: "/settings" }];
const PageNames = ["My UIs"];

interface ApplicationLayoutProps {
  page?: (typeof PageNames)[number];
  title?: string;
  children?: React.ReactNode;
}

export const ApplicationLayout = ({
  page,
  title,
  children,
}: ApplicationLayoutProps) => {
  const { data: session } = useSession();
  const user = session && session.user;

  return (
    <>
      <Head>
        <title>{title ? `${title} | Rapidpages` : "Rapidpages"}</title>
      </Head>
      <div className="min-h-full">
        <Navbar
          logo={<Logo className="h-8 w-auto" />}
          items={navigation.map((item) => ({
            label: item.name,
            href: item.href,
          }))}
          userMenu={
            <Dropdown
              items={userNavigation.map((item) => ({
                label: item.name,
                onClick: () => {/* handle click */},
              }))}
            />
          }
        />
        <main>{children}</main>
      </div>
      <CustomToaster />
    </>
  );
};
