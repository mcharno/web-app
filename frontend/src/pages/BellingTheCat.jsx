import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BellingTheCat.css';

const IMG_BASE = '/images/projects/belling-the-cat';

// Native pixel dimensions, so the browser reserves correct space before
// each lazy-loaded image arrives (avoids layout shift that would throw off
// the Quick Links anchor-scroll further down the page).
const IMG_DIMENSIONS = {
  'rdf-visualisation.png': [860, 700],
  'rdf-welkin.png': [860, 700],
  'stellar_web.png': [734, 716],
  'vb-menu.png': [770, 637],
  'vb-network.png': [531, 464],
  'vos-conductor.png': [1009, 559],
  'vos-dir.png': [998, 498],
  'vos-dirdata.png': [998, 459],
  'vos-dirsettings.png': [998, 865],
  'vos-graphs.png': [1008, 462],
  'vos-install.png': [955, 558],
  'vos-newdir.png': [998, 405],
  'vos-rewrite.png': [998, 656],
  'vos-sparql.png': [1008, 874],
};

const Figure = ({ src, alt, caption }) => {
  const [width, height] = IMG_DIMENSIONS[src];
  return (
    <figure className="doc-figure">
      <img
        src={`${IMG_BASE}/${src}`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

const BellingTheCat = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // React renders after the browser's initial fragment scroll, so anchor
  // links (e.g. from the Quick Links nav) need a manual scroll on mount.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <div className="belling-page">
      <button onClick={() => navigate('/projects')} className="back-to-archives">
        ← Back to Projects
      </button>

      <header className="project-header">
        <h1>Belling the Cat</h1>
        <p className="project-year">2015</p>
        <p className="subtitle">
          Making CIDOC Conceptual Reference Model (CRM) data available as Linked Open Data (LOD): a
          practical hands-on workshop of a complete solution using freeware
        </p>
      </header>

      <section className="project-intro">
        <div className="fable-meaning">
          <h3>About &ldquo;Belling the Cat&rdquo;</h3>
          <p>
            <em>
              The mice meet in council to debate the problem of the new cat in the district. One
              suggests that a bell should be attached to the cat to give a warning. This is greeted
              with universal approval until someone asks &ldquo;How?&rdquo;
            </em>
          </p>
        </div>

        <h2>Abstract</h2>
        <p>
          Cultural Heritage Informatics specialists are often heard to say &ldquo;just publish your
          CRM data as linked open data so that others can use it&rdquo;, but how do we actually do
          that? This workshop aims to lead attendees through the process of taking an export of
          delimited text (i.e. comma separated values) from their database, converting it to CRM
          compatible RDF/XML and then making it available via a triple store for consumption by
          humans or machines as LOD.
        </p>
        <p>
          The course provides an introduction to LOD and then leads users through a cookbook of
          simple to follow techniques for creating and publishing it. All software used in the
          workshop is freeware and runs on the free and open source operating system Linux. The
          software and operating system are uniquely capable of running on underpowered hardware,
          making deploying it simple even with limited support from an IT department or support
          services.
        </p>

        <h2>Details</h2>
        <p>
          This tutorial guides you through the process of setting up a server, setting up a triple
          store, populating that triple store with your data, and publishing your data as LOD. This
          process uses a Raspberry Pi (RPi) as the server hardware, a Linux based operating system,
          and free and open source software for the triple store and application server. The
          tutorial assumes that you are using a RPi, but if you don&rsquo;t have a physical RPi
          available, a VirtualBox virtual machine with a similar OS (Ubuntu) and similar specs can be
          used instead &mdash; the RPi is really only used for the novelty of building a full LOD
          server on a device that small. These instructions could be followed to build the same
          solution stack on different hardware as long as a Debian-based (Debian, Ubuntu, Mint) Linux
          OS is used.
        </p>

        <div className="tech-stack">
          <strong>Technologies:</strong>
          <span>CIDOC CRM</span>
          <span>RDF/XML</span>
          <span>Virtuoso</span>
          <span>SPARQL</span>
          <span>Raspberry Pi</span>
          <span>STELLAR</span>
        </div>

        <nav className="quick-links" aria-label="Quick links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#rpi-setup">1. Setup your RPi</a></li>
            <li><a href="#virtualbox-setup">2. Setup your RPi-like Virtual Machine</a></li>
            <li><a href="#virtuoso-setup">3. Setup Virtuoso Open Source Server</a></li>
            <li><a href="#create-rdf">4. Create RDF from Relational Data</a></li>
            <li><a href="#vos-lod">5. Setup Virtuoso Open Source Server for Linked Open Data</a></li>
            <li><a href="#conclusion">6. Conclusion</a></li>
            <li><a href="#appendix-allegrograph">Appendix: AllegroGraph &amp; Pubby</a></li>
            <li><a href="#appendix-settings">Appendix: Settings</a></li>
            <li><a href="#appendix-links">Appendix: External Links</a></li>
          </ul>
        </nav>
      </section>

      <section className="tutorial-section">
        <h2>Tutorial Modules</h2>

        {/* 1: Set up RPi */}
        <div className="module" id="rpi-setup">
          <div className="module-header">
            <span className="module-number">1</span>
            <h3>Set up RPi</h3>
          </div>
          <div className="module-content">
            <p>
              Assuming you are using a RPi, the following instructions will guide you through the
              process of installing and configuring your machine. If you are using the VirtualBox
              virtual machine instead, skip ahead to <a href="#virtualbox-setup">section 2</a>.
            </p>
            <ul>
              <li>
                Download the Raspbian image from{' '}
                <a href="http://www.raspberrypi.org/downloads" target="_blank" rel="noopener noreferrer">
                  raspberrypi.org/downloads
                </a>
                <ul>
                  <li>
                    If you&rsquo;re less comfortable with the command line you can download the
                    NOOBS package, which sets up the install via a GUI
                  </li>
                </ul>
              </li>
              <li>Unpack the ZIP file onto your computer</li>
              <li>
                Open up a terminal and identify the SD card with <code>diskutil list</code>
              </li>
            </ul>

            <div className="code-block">
              <pre>{`$ diskutil list
/dev/disk0
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *251.0 GB   disk0
   1:                        EFI                         209.7 MB   disk0s1
   2:                  Apple_HFS Macintosh HD            250.1 GB   disk0s2
   3:                 Apple_Boot Recovery HD             650.0 MB   disk0s3
/dev/disk1
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *7.9 GB     disk1
   1:                 DOS_FAT_32 RPI                     7.9 GB     disk1s1`}</pre>
            </div>

            <ul>
              <li>
                Unmount the partition of the SD card (<code>disk1s1</code> in the output above) with{' '}
                <code>diskutil unmountDisk /dev/disk1s1</code>
              </li>
            </ul>

            <div className="code-block">
              <pre>{`$ diskutil unmountDisk /dev/disk1s1
Unmount of all volumes on disk1 was successful`}</pre>
            </div>

            <ul>
              <li>
                Copy the image you downloaded onto the unmounted SD card (this will take a few
                minutes)
              </li>
            </ul>

            <div className="code-block">
              <pre>{`$ sudo dd bs=1m if=2013-09-25-wheezy-raspbian.img of=/dev/disk1
Password:
2825+0 records in
2825+0 records out
2962227200 bytes transferred in 1795.840785 secs (1649493 bytes/sec)`}</pre>
            </div>

            <ul>
              <li>
                Unmount and disconnect the SD card, plug it into your RPi, and turn the RPi on
              </li>
            </ul>

            <h4>Configure Raspbian</h4>
            <p>With a freshly installed instance of Raspbian, we can start to configure the OS for our purposes.</p>

            <h4>General</h4>
            <ul>
              <li>
                Upon successful boot, you should be presented with the &ldquo;Raspberry Pi Software
                Configuration Tool (raspi-config)&rdquo;
              </li>
              <li>
                Navigation can be done with the arrow and tab keys, and Enter/Return can be used to
                select an option
                <ul>
                  <li>Select option 1, <em>Expand Filesystem</em></li>
                  <li>Change the default user password if desired, but write it down somewhere safe</li>
                  <li>
                    Enter option 8, <em>Advanced Options</em>, and enable SSH to allow remote
                    management of the RPi
                  </li>
                  <li>Other settings should be fine with the defaults, but change language/regional settings if required</li>
                </ul>
              </li>
              <li>Once you&rsquo;re done with <code>raspi-config</code>, select <em>Finish</em> and reboot the RPi</li>
            </ul>

            <h4>Networking &mdash; Wireless</h4>
            <p>
              Without a network connection you have an inexpensive and underpowered workstation.
              While that&rsquo;s neat in itself, it&rsquo;s more useful to set up the network so we
              can update the system and manage it remotely.
            </p>
            <ul>
              <li>
                Open up <code>/etc/network/interfaces</code> in a text editor (<code>nano</code> works
                fine on the RPi)
              </li>
            </ul>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ sudo nano /etc/network/interfaces`}</pre>
            </div>
            <p>Ensure that the file looks like this:</p>
            <div className="code-block">
              <pre>{`auto lo

iface lo inet loopback
iface eth0 inet dhcp

allow-hotplug wlan0
iface wlan0 inet manual
wpa-roam /etc/wpa_supplicant/wpa_supplicant.conf
iface default inet dhcp`}</pre>
            </div>
            <p>
              Edit <code>/etc/wpa_supplicant/wpa_supplicant.conf</code> to support your wireless
              access point, changing the <code>ssid</code> and <code>psk</code> (passkey) to the
              appropriate values:
            </p>
            <div className="code-block">
              <pre>{`ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
        ssid="wlan-legacy"
        psk="soop3rs3cr3t"
# RSN (for WP2) and WPA (for WPA1)
        proto=RSN
# WPA-PSK or WPA-EAP (Pre-Shared or Enterprise)
        key_mgmt=WPA-PSK
# CCMP or TKIP (for WPA2 or WPA1)
        pairwise=CCMP
# OPEN, SHARED or LEAP
        auth_alg=OPEN
}`}</pre>
            </div>
            <p>
              Reboot your RPi to accept the new network settings, then check it has an IP address
              with <code>ifconfig</code>:
            </p>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ ifconfig
eth0      Link encap:Ethernet  HWaddr b8:27:eb:8a:14:65
          UP BROADCAST MULTICAST  MTU:1500  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0

wlan0     Link encap:Ethernet  HWaddr 80:1f:02:af:45:15
          inet addr:192.168.1.116  Bcast:192.168.1.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:285 errors:0 dropped:308 overruns:0 frame:0
          TX packets:150 errors:0 dropped:0 overruns:0 carrier:0`}</pre>
            </div>
            <p>
              If your RPi hasn&rsquo;t connected to your network, double check that DHCP is enabled
              and the SSID and passphrase settings are correct.
            </p>

            <h4>Networking &mdash; Wired</h4>
            <p>
              The RPi ethernet port is auto-sensing, which means you should just be able to connect
              an RJ-45 cable from a router/switch to your RPi to get going. If you don&rsquo;t have a
              router or switch handy, the RPi also (theoretically) supports connecting directly to
              another computer without the need for a crossover cable.
            </p>

            <h4>SSH</h4>
            <p>
              Now with your RPi connected to a network, you can start managing it via SSH from
              another computer. Identify the IP address (either via <code>ifconfig</code> on the RPi
              or by checking the router interface), then SSH in from a computer on the same network:
            </p>
            <div className="code-block">
              <pre>{`$ ssh pi@192.168.1.116
pi@192.168.1.116's password:
Linux raspberrypi 3.6.11+ #538 PREEMPT Fri Aug 30 20:42:08 BST 2013 armv6l
Last login: Sun Oct 27 21:10:08 2013
pi@raspberrypi ~ $`}</pre>
            </div>
            <p>
              Enter your password &mdash; if you haven&rsquo;t changed it, the default password is{' '}
              <code>raspberry</code>.
            </p>

            <h4>Updates</h4>
            <p>
              Update the package definitions on your RPi to the latest versions with{' '}
              <code>sudo apt-get update</code>:
            </p>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ sudo apt-get update
Hit http://raspberrypi.collabora.com wheezy Release.gpg
Get:1 http://mirrordirector.raspbian.org wheezy Release.gpg [490 B]
Get:5 http://mirrordirector.raspbian.org wheezy/main armhf Packages [7,415 kB]
Fetched 7,519 kB in 49s (151 kB/s)
Reading package lists... Done`}</pre>
            </div>
            <p>Then upgrade the actual packages with <code>sudo apt-get upgrade</code>:</p>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ sudo apt-get upgrade
Reading package lists... Done
Building dependency tree
The following packages will be upgraded:
  apt apt-utils base-files cups-bsd cups-client cups-common curl dmsetup dpkg ...
46 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
Need to get 59.9 MB of archives.
After this operation, 774 kB disk space will be freed.
Do you want to continue [Y/n]? y
   .
   .
   .
Setting up liblvm2app2.2:armhf (2.02.95-8+rpi1) ...
Processing triggers for menu ...
Processing triggers for initramfs-tools ...`}</pre>
            </div>
          </div>
        </div>

        {/* 2: Set up VirtualBox */}
        <div className="module" id="virtualbox-setup">
          <div className="module-header">
            <span className="module-number">2</span>
            <h3>Set up VirtualBox (Alternative)</h3>
          </div>
          <div className="module-content">
            <p>
              These instructions are for setting up a RPi-like virtual machine in VirtualBox. The
              chosen OS is Ubuntu Server 64-bit, which is similar to Raspbian, with limited resources
              set to emulate the RPi hardware. More resources are certainly allowed, but the limited
              memory and CPU power highlight the flexibility of these systems.
            </p>
            <p>
              To begin with, we need to add a Host-only Network to the VirtualBox application. This
              allows us to work with our Ubuntu Servers so we can SSH and access the server from the
              host (your laptop).
            </p>
            <ul>
              <li>Open up VirtualBox and go to <em>File &rarr; Preferences &rarr; Network</em></li>
              <li>Add a network by clicking on the icon with the NIC and &lsquo;+&rsquo;</li>
            </ul>

            <Figure src="vb-network.png" alt="VirtualBox host network settings" caption="Network settings" />

            <p>
              Setting up your VirtualBox host on a Host-only network will not allow you to connect to
              the outside world, so you won&rsquo;t be able to <code>apt-get</code> new packages. If
              you need internet access, change your VirtualBox guest machine settings to NAT and
              restart your LOD Server VM. The <code>LOD_Server.ova</code> image mentioned below has
              an up-to-date version of Ubuntu Server and the Virtuoso Open Source software already
              installed.
            </p>
            <ul>
              <li>
                Import the prepared VirtualBox Appliance for the tutorial, <code>LOD_Server.ova</code>
                <ul>
                  <li>Untick the DVD option to better reflect a RPi or server</li>
                  <li>
                    Make sure USB 2.0 for the guest is also disabled, unless you have the Oracle VM
                    VirtualBox Extension Pack for the host
                  </li>
                </ul>
              </li>
              <li>Start the <em>LOD Server</em> VM</li>
            </ul>

            <Figure src="vb-menu.png" alt="VirtualBox menu with LOD Server imported" caption="Virtual Box menu" />

            <p>
              Once the virtual machine is started you can SSH into the server from your host
              (laptop). The default IP of the guest is <code>192.168.56.101</code>, so use that IP
              for SSH as well as connecting to the VOS Conductor interface.
            </p>
            <ul>
              <li><strong>username:</strong> pi</li>
              <li><strong>password:</strong> password</li>
            </ul>
            <div className="code-block">
              <pre>{`$ ssh pi@192.168.56.101
pi@192.168.56.101's password:
Welcome to Ubuntu 12.04.3 LTS (GNU/Linux 3.8.0-29-generic x86_64)

  System load:  0.37              Processes:           79
  Usage of /:   19.9% of 6.99GB   Users logged in:     0
  Memory usage: 50%               IP address for eth0: 192.168.56.101

Last login: Wed Nov  6 15:04:28 2013 from 192.168.56.1
pi@ubuntu:~$`}</pre>
            </div>
            <p>When the virtual machine is running you can also fire up the VOS Conductor interface at:</p>
            <ul>
              <li><code>http://192.168.56.101:8890/conductor/</code></li>
              <li><strong>username:</strong> dba</li>
              <li><strong>password:</strong> dba</li>
            </ul>
            <p>
              Keep the VirtualBox virtual machine running in the background of your workstation for
              the rest of the tutorial &mdash; we&rsquo;ll be interacting with it both via the command
              line and web interface.
            </p>
          </div>
        </div>

        {/* 3: Set up Virtuoso */}
        <div className="module" id="virtuoso-setup">
          <div className="module-header">
            <span className="module-number">3</span>
            <h3>Set up Virtuoso Open Source Server</h3>
          </div>
          <div className="module-content">
            <p>
              If you&rsquo;ve come here from the VirtualBox setup, this has already been done for you
              in the <code>LOD_Server.ova</code> image &mdash; please read on regardless to get a
              better understanding of the steps taken to get you there. From now on we&rsquo;ll refer
              to the RPi and VirtualBox virtual machine as our <strong>LOD Server</strong>; the
              commands that follow should work for either setup.
            </p>

            <h4>Install Virtuoso</h4>
            <p>
              Install Virtuoso Open Source (VOS) Server from the Debian package manager with{' '}
              <code>sudo apt-get install virtuoso-opensource</code>:
            </p>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ sudo apt-get install virtuoso-opensource
Reading package lists... Done
Building dependency tree
The following extra packages will be installed:
  imagemagick-common liblqr-1-0 libmagickcore5 libmagickwand5 libvirtodbc0 libwbxml2-0 odbcinst
  odbcinst1debian2 virtuoso-opensource-6.1 virtuoso-opensource-6.1-bin virtuoso-opensource-6.1-common
  virtuoso-server virtuoso-vad-conductor virtuoso-vsp-startpage
0 upgraded, 15 newly installed, 0 to remove and 0 not upgraded.
Need to get 0 B/10.1 MB of archives.
After this operation, 29.9 MB of additional disk space will be used.
Do you want to continue [Y/n]? y
   .
   .
   .
[ ok ] Starting Virtuoso OpenSource Edition 6.1 : virtuoso-opensource-6.1.
Setting up virtuoso-opensource (6.1.4+dfsg1-7+rpi1) ...
Setting up virtuoso-vad-conductor (6.1.4+dfsg1-7+rpi1) ...
Setting up virtuoso-vsp-startpage (6.1.4+dfsg1-7+rpi1) ...`}</pre>
            </div>

            <div className="warning-box">
              <strong>Important:</strong> As part of the installation, Debian will ask you for
              passwords for the <code>dba</code> and <code>dav</code> users &mdash; if you leave
              this blank, the Virtuoso service will not start after installation. If the install
              fails, default passwords will be used (<code>dba</code>/<code>dba</code> and{' '}
              <code>dav</code>/<code>dav</code>).
            </div>

            <Figure src="vos-install.png" alt="VOS install screenshot" caption="VOS install screenshot" />

            <p>
              These instructions were mostly taken from the{' '}
              <a href="http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSDebianNotes" target="_blank" rel="noopener noreferrer">
                OpenLink Software Guide
              </a>
              , which should be consulted for more information. Now modify the{' '}
              <code>virtuoso.ini</code> file to enable the RDF loader we&rsquo;ll use later:
            </p>
            <div className="code-block">
              <pre>{`pi@ubuntu:~$ sudo nano /etc/virtuoso-opensource-6.1/virtuoso.ini
[sudo] password for pi:`}</pre>
            </div>
            <p>Add the home directory to the <code>DirsAllowed</code> property:</p>
            <div className="code-block">
              <pre>{`;
;  Server parameters
;
[Parameters]
ServerPort               = 1111
LiteMode                 = 0
DisableUnixSocket        = 1
DisableTcpSocket         = 0
ServerThreads            = 20
CheckpointInterval       = 60
O_DIRECT                 = 0
CaseMode                 = 2
MaxStaticCursorRows      = 5000
CheckpointAuditTrail     = 0
AllowOSCalls             = 0
SchedulerInterval        = 10
DirsAllowed              = ., /usr/share/virtuoso-opensource-6.1/vad,/home/pi
ThreadCleanupInterval    = 0`}</pre>
            </div>

            <h4>Locations</h4>
            <table className="doc-table">
              <thead>
                <tr><th>Resource</th><th>Path</th></tr>
              </thead>
              <tbody>
                <tr><td>config file</td><td><code>/etc/virtuoso-opensource-6.1/virtuoso.ini</code></td></tr>
                <tr><td>binary</td><td><code>/usr/bin/virtuoso-t</code></td></tr>
                <tr><td>logs</td><td><code>/var/lib/virtuoso-opensource-6.1/db/virtuoso.log</code></td></tr>
              </tbody>
            </table>

            <h4>Commands</h4>
            <table className="doc-table">
              <thead>
                <tr><th>Action</th><th>Command</th></tr>
              </thead>
              <tbody>
                <tr><td>start</td><td><code>sudo /etc/init.d/virtuoso-opensource-6.1 start</code></td></tr>
                <tr><td>stop</td><td><code>/etc/init.d/virtuoso-opensource-6.1 stop</code></td></tr>
                <tr><td>restart</td><td><code>/etc/init.d/virtuoso-opensource-6.1 restart</code></td></tr>
                <tr><td>view logs</td><td><code>tail -f /var/lib/virtuoso-opensource-6.1/db/virtuoso.log</code></td></tr>
              </tbody>
            </table>

            <h4>Web Admin</h4>
            <p>
              VOS has a web interface for managing the server, living locally at{' '}
              <code>http://localhost:8890/conductor</code>. Since we&rsquo;re not working directly on
              the LOD Server, we need to access it from our laptops via the IP address instead &mdash;
              replace <code>localhost</code> with the IP address of your LOD Server to log into the
              VOS web admin.
            </p>

            <Figure src="vos-conductor.png" alt="VOS Conductor landing page" caption="VOS Conductor landing page" />

            <p>Now that VOS is running and ready to go, we need to create some RDF to publish as Linked Open Data.</p>
          </div>
        </div>

        {/* 4: Create RDF from Relational Data */}
        <div className="module" id="create-rdf">
          <div className="module-header">
            <span className="module-number">4</span>
            <h3>Create RDF from Relational Data</h3>
          </div>
          <div className="module-content">
            <p>
              If you brought data with you, this is where we go through the process of creating RDF
              with the{' '}
              <a href="http://hypermedia.research.southwales.ac.uk/resources/STELLAR-applications/" target="_blank" rel="noopener noreferrer">
                STELLAR tools
              </a>
              . This process will be different for everyone, but a general workflow is described
              below to support attendees, using a sample dataset that will hopefully closely resemble
              your own data. If you already have RDF ready to import into VOS, skip ahead to{' '}
              <a href="#vos-lod">section 5</a>.
            </p>

            <h4>Know Your Data</h4>
            <p>
              To successfully convert your data from tabular data to RDF, you need to understand what
              all of the fields in your dataset mean. The tool we&rsquo;ll use for creating the
              RDF/XML is the STELLAR tools, which will effectively &ldquo;translate&rdquo; your data
              to RDF. If you&rsquo;re using the sample data kindly provided by{' '}
              <a href="https://docs.google.com/spreadsheet/ccc?key=0AjpVt48bVrZxdEw5aS1fdEU5d25lUWw5dFdiZkljdGc&usp=sharing" target="_blank" rel="noopener noreferrer">
                The British Museum (BM)
              </a>
              , take a moment to have a look at it and get to grips with it &mdash; the easiest way
              to view the BM data is with an application like Excel, but any text editor will work.
            </p>

            <h4>BM Cheat Sheet</h4>
            <table className="doc-table">
              <thead><tr><th>Concept</th></tr></thead>
              <tbody>
                <tr><td>PRN</td></tr>
                <tr><td>Label</td></tr>
                <tr><td>Period Culture</td></tr>
                <tr><td>Place</td></tr>
                <tr><td>Country</td></tr>
                <tr><td>Material</td></tr>
                <tr><td>Object Name</td></tr>
                <tr><td>Description</td></tr>
              </tbody>
            </table>

            <h4>Know Your Tool</h4>
            <p>
              The tool we&rsquo;re going to use to convert the relational data is the{' '}
              <a href="http://reswin1.isd.glam.ac.uk/stellar/default.aspx" target="_blank" rel="noopener noreferrer">
                STELLAR.Web tool
              </a>{' '}
              developed by Ceri Binding at the University of South Wales. If you have access to a
              Windows machine, you can also use the STELLAR.Console tool, which allows custom
              templates and offers more functionality than STELLAR.Web.
            </p>
            <p>
              The STELLAR tools convert relational data to RDF/XML using interchangeable templates,
              which also conform to the CIDOC-CRM. The template we&rsquo;ll be using is a custom-built
              one for this workshop, the <strong>crm_objects</strong> template. More templates are
              available, most of which relate to the CRM-EH extension for excavation data.
            </p>

            <h4>Know Your Template</h4>
            <p>
              The CRM Objects template was created for this tutorial since no other existing
              templates were suitable for representing basic object data within the CIDOC CRM. Most
              STELLAR templates were built to represent excavation data within an extension of the
              CIDOC CRM; the closest fit was the CLAROS templates, originally used for art data.
              Unfortunately the CLAROS templates had built-in conditions for their own idiosyncratic
              data, so weren&rsquo;t very transferable &mdash; but the CLAROS Objects template was a
              useful baseline for the new, more generic CRM Objects template. The templates work by
              parsing a CSV file, identifying specific column headers, and inserting that column data
              into the appropriate place within the template, producing a clean RDF/XML representation
              of the relational data.
            </p>

            <h5>Column Headers</h5>
            <p>The CRM Objects template expects the following column header names:</p>
            <table className="doc-table doc-table--wide">
              <tbody>
                <tr><td><code>object_id</code></td><td>[Mandatory] A string value that serves to uniquely identify the object within its source dataset</td></tr>
                <tr><td><code>object_label</code></td><td>A short human-readable label for describing the object in user interfaces</td></tr>
                <tr><td><code>object_title</code></td><td>A (definitive) descriptive title for the object</td></tr>
                <tr><td><code>object_type_label</code></td><td>A string that identifies a particular type of object, e.g. pottery, statue, gem</td></tr>
                <tr><td><code>object_type_uri</code></td><td>A URI that identifies a particular type of object</td></tr>
                <tr><td><code>find_place_label</code></td><td>Description of place</td></tr>
                <tr><td><code>find_place_uri</code></td><td>URI of place described elsewhere</td></tr>
                <tr><td><code>production_period_label</code></td><td>A short human-readable label for describing the period in user interfaces</td></tr>
                <tr><td><code>production_period_uri</code></td><td>A globally unique URI that identifies a particular period</td></tr>
                <tr><td><code>production_material_label</code></td><td>Label for this material</td></tr>
                <tr><td><code>production_material_uri</code></td><td>URI for this material</td></tr>
              </tbody>
            </table>

            <h5>BM Cheat Sheet (mapping)</h5>
            <table className="doc-table doc-table--wide">
              <tbody>
                <tr><td><code>object_id</code></td><td>PRN</td></tr>
                <tr><td><code>object_label</code></td><td>Description</td></tr>
                <tr><td><code>object_title</code></td><td>Label</td></tr>
                <tr><td><code>object_type_label</code></td><td>Object Name</td></tr>
                <tr><td><code>find_place_label</code></td><td>Place</td></tr>
                <tr><td><code>production_period_label</code></td><td>Period Culture</td></tr>
                <tr><td><code>production_material_label</code></td><td>Material</td></tr>
              </tbody>
            </table>

            <h4>LinkedDataToolkit</h4>
            <p>
              The eagle-eyed of you will notice that we&rsquo;ve left off the <code>*_uri</code>{' '}
              fields &mdash; that&rsquo;s because they don&rsquo;t exist in our BM data (kudos if
              they already exist in yours), so we&rsquo;ll use another toolkit to populate those
              fields via lookups to existing vocabularies with SPARQL endpoints. This toolkit, the
              LinkedDataToolkit, is a simple Java application containing a series of lookups to
              SPARQL or REST endpoints. It expects the column headers above and looks up the values
              in those fields against the appropriate vocabulary or authority:
            </p>
            <ul>
              <li>
                <code>object_type_label</code> &rarr;{' '}
                <a href="http://heritagedata.org/test/schemes/mda_obj.html" target="_blank" rel="noopener noreferrer">
                  FISH Archaeological Objects Thesaurus
                </a>
              </li>
              <li>
                <code>find_place_label</code> &rarr;{' '}
                <a href="http://www.geonames.org/" target="_blank" rel="noopener noreferrer">Geonames</a>
              </li>
              <li>
                <code>production_period_label</code> &rarr;{' '}
                <a href="http://heritagedata.org/test/schemes/eh_period.html" target="_blank" rel="noopener noreferrer">
                  EH Periods
                </a>
              </li>
              <li>
                <code>production_material</code> &rarr;{' '}
                <a href="http://dbpedia.org/" target="_blank" rel="noopener noreferrer">DBpedia</a>
              </li>
            </ul>
            <p>
              Those vocabularies aren&rsquo;t obviously perfect for all datasets and have a noticeable
              bias towards UK authorities and English &mdash; the FISH Archaeological Objects and EH
              Periods Thesauri are maintained by English Heritage, so won&rsquo;t match all datasets,
              while DBpedia is rather generic but does act as a suitable vocabulary for materials. The
              LinkedDataToolkit source is on GitHub, so feel free to modify it if there are other
              SPARQL endpoints you&rsquo;d rather use. One additional field, <em>country</em>, can be
              used to make the Geonames lookup more accurate, since placenames are notoriously
              difficult to align &mdash; if your dataset doesn&rsquo;t have a countries field but all
              the data is from the same country, you can pass a command line parameter instead.
            </p>

            <h5>Running the LinkedDataToolkit</h5>
            <ul>
              <li>
                Download the <code>LinkedDataToolkit.zip</code> file and extract it to your local
                machine, making sure the <code>lib</code> directory sits alongside{' '}
                <code>LinkedDataToolkit.jar</code>
              </li>
              <li>Open a terminal and navigate to the directory you extracted the zip to</li>
              <li>
                The tool expects three command line parameters:
                <ul>
                  <li><strong>FILE_NAME</strong> [mandatory]: path to the CSV file to enhance</li>
                  <li>
                    <strong>GEONAMES_USER</strong> [mandatory]: username for the{' '}
                    <a href="http://www.geonames.org/login" target="_blank" rel="noopener noreferrer">Geonames API</a>
                  </li>
                  <li><strong>COUNTRY</strong>: a Geonames country code (e.g. <code>GB</code> for United Kingdom)</li>
                </ul>
              </li>
            </ul>
            <div className="code-block">
              <pre>{`pi@ubuntu $ java -jar LinkedDataToolkit.jar /Users/charno/Desktop/BellingTheCat/crm_objects.csv geonamesuser
Following headers with potential lookups found:
	object_type_label
	find_place_label
	production_period_label
	production_material_label
BCB287
	object_type_uri=http://purl.org/heritagedata/schemes/mda_obj/concepts/95795
	find_place_uri=http://sws.geonames.org/2654897
	production_period_uri=http://purl.org/heritagedata/schemes/eh_period/concepts/NE
	production_material_uri=http://dbpedia.org/resource/Antler
BCB2595
	object_type_uri=http://purl.org/heritagedata/schemes/mda_obj/concepts/96755
	find_place_uri=http://sws.geonames.org/2646302
	production_material_uri=http://dbpedia.org/resource/Pewter
		.
		.
		.
YCA40958
	object_type_uri=http://purl.org/heritagedata/schemes/mda_obj/concepts/95796
	find_place_uri=http://sws.geonames.org/349653
	production_material_uri=http://dbpedia.org/resource/Iron
--------------------------------------------
New file written to /Users/charno/Desktop/BellingTheCat/crm_objects-enhanced.csv`}</pre>
            </div>
            <p>The new file is listed at the bottom of the output, with <em>-enhanced</em> appended to the old filename.</p>

            <h5>Create RDF/XML</h5>
            <p>
              With the new enhanced CSV file, we&rsquo;re ready to use the STELLAR.Web tool to create
              RDF/XML. It requires three things: the CSV file, a template, and a namespace prefix
              &mdash; the URL root under which all local resources (e.g. object IDs) will live.
            </p>

            <Figure src="stellar_web.png" alt="The STELLAR.Web tool with populated fields" caption="The STELLAR.Web tool with populated fields" />

            <p>
              Download the created file (the link is underneath the Submit button). You can open the
              file and look at it, but it&rsquo;s dense XML so it&rsquo;s not recommended &mdash; if
              you want to see what your data looks like, open it in a semantic browser such as
              SemanticWorks, Gruff, RDF-Gravity, or Simile Welkin.
            </p>

            <Figure src="rdf-visualisation.png" alt="The BM data visualised in Welkin" caption="The BM data visualised in Welkin" />

            <h5>Simile Welkin</h5>
            <p>An easy tool to quickly visualise RDF data is Simile Welkin from MIT. To set it up:</p>
            <ul>
              <li>Download the Simile Welkin tarball and extract it to your working directory</li>
              <li>
                Set the <code>JAVA_HOME</code> variable for your machine (on Mac/*nix, add this to
                your <code>.bash_profile</code>):
              </li>
            </ul>
            <div className="code-block">
              <pre>{`MAC
export JAVA_HOME=$(/usr/libexec/java_home)

LINUX
export JAVA_HOME=/usr/lib/jvm/java-7-oracle`}</pre>
            </div>
            <p>Activate your new path settings, then navigate to the Welkin directory and run the script:</p>
            <div className="code-block">
              <pre>{`$ source ~/.bash_profile
$ ./welkin.sh`}</pre>
            </div>

            <Figure src="rdf-welkin.png" alt="The Simile Welkin application" caption="The Simile Welkin application" />

            <p>Load the RDF data and have a play. Now we&rsquo;re ready to load our data into the triple store and make it accessible as Linked Open Data.</p>
          </div>
        </div>

        {/* 5: Setup VOS for LOD */}
        <div className="module" id="vos-lod">
          <div className="module-header">
            <span className="module-number">5</span>
            <h3>Setup VOS for Linked Open Data</h3>
          </div>
          <div className="module-content">
            <p>
              The following instructions have been largely lifted from the very detailed OpenLink
              Software Guide on{' '}
              <a href="http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VirtDeployingLinkedDataGuide" target="_blank" rel="noopener noreferrer">
                Deploying Linked Data
              </a>
              .
            </p>

            <h4>Upload RDF to VOS</h4>
            <ul>
              <li>Start up the LOD Server if it&rsquo;s not already running</li>
              <li>Copy the RDF file to your LOD Server</li>
            </ul>
            <div className="code-block">
              <pre>{`pi@ubuntu $ scp 5san30o3.rdf pi@192.168.56.101:~/
pi@192.168.56.101's password:
5san30o3.rdf                                          100%  184KB 183.9KB/s   00:00`}</pre>
            </div>
            <p>From here you can either work directly on the LOD Server or SSH into it. Log into the SQL terminal:</p>
            <div className="code-block">
              <pre>{`pi@raspberrypi ~ $ isql-vt -U dba
Connected to OpenLink Virtuoso
Driver: 06.01.3127 OpenLink Virtuoso ODBC Driver
OpenLink Interactive SQL (Virtuoso), version 0.9849b.
Type HELP; for help and EXIT; to exit.
SQL>`}</pre>
            </div>
            <p>
              Load the RDF via the SQL terminal, replacing the parameters below with the path to the
              RDF and the Graph IRI the data will appear in (e.g. <code>http://www.museum.org/data</code>):
            </p>
            <div className="code-block">
              <pre>{`SQL> DB.DBA.RDF_LOAD_RDFXML_MT (file_to_string_output ('/home/pi/5san30o3.rdf'), '', 'http://www.museum.org/data');

Done. -- 95 msec.
SQL>`}</pre>
            </div>
            <p>Check for the data in VOS Conductor:</p>

            <Figure src="vos-graphs.png" alt="A list of the Graphs in VOS" caption="A list of the Graphs in VOS" />

            <p>And run a SPARQL query to confirm the data actually exists in the Graph:</p>
            <div className="code-block">
              <pre>{`SELECT *
WHERE {
    GRAPH <http://www.museum.org/data> {
        ?s ?p ?o
    }
}
LIMIT 100`}</pre>
            </div>

            <Figure src="vos-sparql.png" alt="Selecting 100 entries of the RDF data we just loaded" caption="Selecting 100 entries of the RDF data we just loaded" />

            <p>You can also explicitly define the Graph IRI in the field above the SPARQL text area to simplify the query.</p>

            <h4>URL Rewriting</h4>
            <p>The following URL will render an HTML page:</p>
            <div className="code-block">
              <pre>{`http://192.168.56.101:8890/sparql?query=construct%20%7B%3Chttp%3A%2F%2Fwww.museum.org%2Fdata%2FE22_BCB287%3E%20%3Fp%20%3Fo%7D%20where%20%7B%3Chttp%3A%2F%2Fwww.museum.org%2Fdata%2FE22_BCB287%3E%20%3Fp%20%3Fo%7D&format=text%2Fhtml`}</pre>
            </div>
            <p>Which is effectively following this SPARQL query:</p>
            <div className="code-block">
              <pre>{`CONSTRUCT {<http://www.museum.org/data/E22_BCB287> ?p ?o}
WHERE {<http://www.museum.org/data/E22_BCB287> ?p ?o}`}</pre>
            </div>
            <p>
              That&rsquo;s all fine as a proof of concept, but real Linked Open Data resolves to a
              proper URI in the domain we declared in our RDF. Accomplishing that depends on your own
              network settings &mdash; but we can set up a local machine to pretend. Update{' '}
              <code>/etc/hosts</code> on your workstation to forward all traffic for our imaginary
              domain to the LOD Server:
            </p>
            <div className="code-block">
              <pre>{`pi@ubuntu$ sudo nano /etc/hosts`}</pre>
            </div>
            <p>Add an entry for our <code>www.museum.org</code> domain to the file:</p>
            <div className="code-block">
              <pre>{`##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
192.168.56.101  www.museum.org
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
fe80::1%lo0     localhost`}</pre>
            </div>
            <p>
              Now we need to configure VOS to convert a URI to that SPARQL query using URL rewriting.
              Go to <em>Web Application Server &rarr; Virtual Domains &amp; Directories</em>, enter{' '}
              <strong>0.0.0.0</strong> in <em>Interface</em>, <strong>80</strong> in <em>Port</em> and{' '}
              <strong>www.museum.org</strong> in <em>HTTP Host</em>, then click <em>Add</em>. Now
              create a SPARQL directory by clicking <em>New Directory</em>:
            </p>

            <Figure src="vos-newdir.png" alt="Creating a new virtual directory in VOS" />

            <p>Set the new directory <em>Type</em> to SPARQL access point:</p>

            <Figure src="vos-dir.png" alt="Setting the directory type to SPARQL access point" />

            <p>
              The settings for the directory will be automatically set except for the{' '}
              <em>Path</em>, which we need to set to <strong>/sparql</strong>:
            </p>

            <Figure src="vos-dirsettings.png" alt="SPARQL directory path settings" />

            <p>
              From here the instructions are designed to set up a similar system to the ADS
              AllegroGraph/Pubby offering (see the{' '}
              <a href="#appendix-allegrograph">appendix</a>). VOS is extremely configurable, so these
              settings can be customised according to your preferences or network limitations. Now
              set up the HTML representation of our Linked Open Data by creating another new virtual
              directory, this time a <strong>File system</strong> type:
            </p>

            <Figure src="vos-dirdata.png" alt="Creating a File system type virtual directory" />

            <p>Set the <em>Path</em> to <strong>/data</strong> and save your changes.</p>
            <p>
              Now we need to set up URL redirect rules to make VOS render the correct content. Click
              the <em>URL-rewrite</em> link for the data virtual directory:
            </p>

            <Figure src="vos-rewrite.png" alt="URL-rewrite settings for the data virtual directory" />

            <p>Change the settings as follows:</p>
            <ul>
              <li><em>Request Path pattern</em> &mdash; <code>(/[^#]*)</code></li>
              <li><em>Rule matching</em> &mdash; <strong>Normal</strong></li>
              <li>
                <em>SPARQL Query</em> &mdash;{' '}
                <code>CONSTRUCT {'{'}&lt;http://www.museum.org$s1&gt; ?p ?o{'}'} WHERE {'{'}&lt;http://www.museum.org$s1&gt; ?p ?o{'}'}</code>
              </li>
              <li><em>Destination Path format</em>:</li>
            </ul>
            <div className="code-block">
              <pre>{`/sparql?query=CONSTRUCT%20%7B%3Chttp%3A%2F%2Fwww.museum.org$s1%3E%20%3Fp%20%3Fo%7D%20%0D%0AWHERE%20%7B%3Chttp%3A%2F%2Fwww.museum.org$s1%3E%20%3Fp%20%3Fo%7D&format=html`}</pre>
            </div>
            <p>Open a web browser and go to a node to check, or use curl with different options for the Accept header:</p>
            <div className="code-block">
              <pre>{`$ curl -H "Accept:text/html" http://www.museum.org/data/E22_BCB287`}</pre>
            </div>
            <p>or:</p>
            <div className="code-block">
              <pre>{`$ curl -I -H "Accept:text/html" http://www.museum.org/data/E22_BCB287`}</pre>
            </div>
            <p>
              From here it&rsquo;d be nice to have content negotiation to provide different
              serialisations of the data depending on the user-agent or request parameters &mdash;
              VOS supports this, but there wasn&rsquo;t enough time to investigate it for the
              workshop. See the OpenLink documentation for more.
            </p>
          </div>
        </div>

        {/* 6: Conclusion */}
        <div className="module" id="conclusion">
          <div className="module-header">
            <span className="module-number">6</span>
            <h3>Conclusion</h3>
          </div>
          <div className="module-content">
            <p>
              Now you have a partially set up LOD Server running on either a RPi or an underpowered
              Linux server. Running a LOD Server in a production environment will no doubt look
              different, dependent on your own environment and domain &mdash; the initial steps of
              this tutorial should prepare you to create and host your own Linked Open Data, but the
              final <em>publication</em> of that data should be guided by your own network
              administrators.
            </p>
            <p>
              The original ADS LOD setup used a combination of AllegroGraph and Pubby. This kind of
              configuration can be investigated as well for people interested in a similar solution
              &mdash; see the <a href="#appendix-allegrograph">AllegroGraph &amp; Pubby appendix</a> below.
            </p>
          </div>
        </div>
      </section>

      <section className="tutorial-section">
        <h2>Appendices</h2>

        {/* Appendix: AllegroGraph & Pubby */}
        <div className="module" id="appendix-allegrograph">
          <div className="module-header">
            <span className="module-number">A</span>
            <h3>AllegroGraph and Pubby Configuration</h3>
          </div>
          <div className="module-content">
            <p>
              AllegroGraph is a graph database which holds RDF triples. Pubby is a Java web
              application that publishes content from a triple store as Linked Open Data and handles
              content negotiation, among other things. The following is a basic overview of how to
              configure AllegroGraph and Pubby to work together to publish Linked Open Data.
            </p>

            <h4>AllegroGraph Installation</h4>
            <p>
              Download and follow the installation instructions on the{' '}
              <a href="http://www.franz.com/agraph/downloads/" target="_blank" rel="noopener noreferrer">
                AllegroGraph website
              </a>
              .
            </p>

            <h5>Settings</h5>
            <table className="doc-table">
              <thead><tr><th>Resource</th><th>Path</th></tr></thead>
              <tbody>
                <tr><td>Config File</td><td><code>[AG_HOME]/ag44/lib/agraph.cfg</code></td></tr>
                <tr><td>Data Directory</td><td><code>[AG_HOME]/ag44/data</code></td></tr>
                <tr><td>Log Files</td><td><code>[AG_HOME]/ag44/log</code></td></tr>
              </tbody>
            </table>

            <h5>Starting</h5>
            <div className="code-block">
              <pre>{`[AG_HOME]/ag44/bin/agraph-control --config /home/adssys/ag44/lib/agraph.cfg start`}</pre>
            </div>
            <h5>Stopping</h5>
            <div className="code-block">
              <pre>{`[AG_HOME]/ag44/bin/agraph-control --config /home/adssys/ag44/lib/agraph.cfg stop`}</pre>
            </div>

            <h5>AG Web View</h5>
            <p>
              This is the web interface for managing the triple store and repositories. All
              management commands &mdash; creating and deleting repositories, adding and removing
              triples, user management, etc &mdash; can be done via this interface.
            </p>
            <ul>
              <li><strong>Location:</strong> <code>http://[SERVER]:10035/</code></li>
            </ul>

            <h5>SPARQL Endpoint</h5>
            <p>
              This is located at the root of AG Web View appended with the path to the repository.
              For an imaginary <code>ADSTest</code> repository, the SPARQL endpoint would be{' '}
              <code>http://[SERVER]:10035/repositories/ADSTest</code>. This isn&rsquo;t available
              outside your network unless you open the AllegroGraph port through your firewall.
            </p>

            <h5><code>data</code> Sub Domain</h5>
            <p>
              Pubby at the ADS has been configured to live on the root of the{' '}
              <code>data.archaeologydataservice.ac.uk</code> sub domain. This domain points at a
              separate server, where Apache then forwards requests to Tomcat on the same machine.
              Additionally, a reverse proxy is set up to forward all requests for AllegroGraph from
              the outside through the <code>sparql/</code> context, configured in{' '}
              <code>[APACHE_HOME]/sites-available/data.archaeologydataservice.ac.uk</code>:
            </p>
            <div className="code-block">
              <pre>{`<Proxy *>
    Order deny, allow
    Allow from all
</Proxy>
ProxyRequests Off
ProxyPass /sparql/ http://localhost:10035/
ProxyPassReverse /sparql/ http://localhost:10035/`}</pre>
            </div>

            <h5>Pubby</h5>
            <p>
              Pubby is the interface between a request and the triple store. When a web browser
              requests an entity, Pubby returns an HTML representation of the data; when a machine
              (e.g. a SPARQL client) makes a request, Pubby returns an XML representation. This is
              known as content negotiation.
            </p>

            <h5>Connecting Pubby to AllegroGraph</h5>
            <p>
              The following are Pubby settings for connecting to AllegroGraph, found in the{' '}
              <code>config.ttl</code> file within the WAR package:
            </p>
            <div className="code-block">
              <pre>{`conf:projectName "Archaeology Data Service";
conf:projectHomepage <http://archaeologydataservice.ac.uk>;
conf:webBase <http://data.archaeologydataservice.ac.uk/>;
conf:indexResource <http://data.archaeologydataservice.ac.uk>;

#Dataset 1
conf:sparqlEndpoint <http://[SERVER]/repositories/ADS>;
conf:datasetBase <http://data.archaeologydataservice.ac.uk/>;
conf:webResourcePrefix "";

#Dataset 2
conf:sparqlEndpoint <http://[SERVER]/repositories/ADS>;
conf:datasetBase <http://data.archaeologydataservice.ac.uk/>;
conf:datasetURIPattern "(class|property)/.*";`}</pre>
            </div>
            <p>Any changes to Pubby (<code>config.ttl</code>) require Tomcat to be restarted to pick them up.</p>
          </div>
        </div>

        {/* Appendix: Settings */}
        <div className="module" id="appendix-settings">
          <div className="module-header">
            <span className="module-number">B</span>
            <h3>Settings</h3>
          </div>
          <div className="module-content">
            <h4>Linked Data</h4>
            <ul>
              <li>Virtuoso SPARQL endpoint: <code>http://[IP]:[PORT]/sparql</code></li>
              <li>
                Named RDF Graph: <code>http://[IP]:[PORT]/claros</code> (as defined in the RDF load)
              </li>
              <li>Entity ID: <code>http://[IP]:[PORT]/claros/1</code></li>
            </ul>

            <h4>DNS Spoof</h4>
            <ul>
              <li>
                Edit <code>/etc/hosts</code> and add <code>[RPI_IP] data.museum.org</code>
              </li>
              <li>Set up a Virtual Server on VOS for <code>data.museum.org</code> on port 80</li>
            </ul>

            <h4>Management</h4>
            <ul>
              <li>Delete Graph: <em>Linked Data &rarr; Graphs &rarr;</em> Delete graph</li>
            </ul>
          </div>
        </div>

        {/* Appendix: External Links */}
        <div className="module" id="appendix-links">
          <div className="module-header">
            <span className="module-number">C</span>
            <h3>External Links</h3>
          </div>
          <div className="module-content">
            <ul>
              <li><a href="http://apohllo.pl/blog/virtuoso-installation-in-debian" target="_blank" rel="noopener noreferrer">Virtuoso installation in Debian</a></li>
              <li><a href="http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VirtDeployingLinkedDataGuide" target="_blank" rel="noopener noreferrer">Deploying Linked Data Guide</a></li>
              <li><a href="http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSDebianNotes" target="_blank" rel="noopener noreferrer">VOS Debian Notes</a></li>
              <li><a href="http://webprotege.stanford.edu/" target="_blank" rel="noopener noreferrer">WebProtégé</a></li>
              <li><a href="http://hypermedia.research.southwales.ac.uk/resources/STELLAR-applications/" target="_blank" rel="noopener noreferrer">STELLAR Applications</a></li>
              <li><a href="http://meyerweb.com/eric/tools/dencoder/" target="_blank" rel="noopener noreferrer">URL Encoder/Decoder</a></li>
              <li><a href="http://docs.openlinksw.com/virtuoso/fn_rdf_load_rdfxml_mt.html" target="_blank" rel="noopener noreferrer">RDF_LOAD_RDFXML_MT Documentation</a></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="project-links">
        <h2>Project Resources</h2>
        <div className="resources-grid">
          <a
            href="https://github.com/mcharno/belling-the-cat"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>GitHub Repository</strong>
            <span>View the complete tutorial and source files</span>
          </a>
          <a
            href="https://github.com/mcharno/linked-data-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>LinkedDataToolkit</strong>
            <span>Java tool for URI enrichment</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default BellingTheCat;
