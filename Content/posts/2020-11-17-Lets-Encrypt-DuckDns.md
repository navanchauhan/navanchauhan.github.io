---
date: 2020-11-17 15:04
description: Short code-snippet to generate HTTPS certificates using the DNS Challenge through Lets Encrypt for a web-server using DuckDNS.
tags: Tutorial, Code-Snippet, Web-Development
---

# Generating HTTPS Certificate using DNS a Challenge through Let's Encrypt

I have a Raspberry-Pi running a Flask app through Gunicorn (Ubuntu 20.04 LTS). I am exposing it to the internet using DuckDNS.

## Dependencies

```bash
sudo apt update && sudo apt install certbot -y
```

## Get the Certificate

```bash
sudo certbot certonly --manual --preferred-challenges dns-01 --email senpai@email.com -d mydomain.duckdns.org
```

After you accept that you are okay with you IP address being logged, it will prompt you with updating your dns record. You need to create a new `TXT` record in the DNS settings for your domain.


For DuckDNS users it is as simple as  entering this URL in their browser:

```
http://duckdns.org/update?domains=mydomain&token=duckdnstoken&txt=certbotdnstxt
```

Where `mydomain` is your DuckDNS domain, `duckdnstoken` is your DuckDNS Token ( Found on the dashboard when you login) and `certbotdnstxt` is the TXT record value given by the prompt.

You can check if the TXT records have been updated by using the `dig` command:

```bash
dig navanspi.duckdns.org TXT
; <<>> DiG 9.16.1-Ubuntu <<>> navanspi.duckdns.org TXT
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 27592
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;navanspi.duckdns.org.        IN    TXT

;; ANSWER SECTION:
navanspi.duckdns.org.    60    IN    TXT    "4OKbijIJmc82Yv2NiGVm1RmaBHSCZ_230qNtj9YA-qk"

;; Query time: 275 msec
;; SERVER: 127.0.0.53#53(127.0.0.53)
;; WHEN: Tue Nov 17 15:23:15 IST 2020
;; MSG SIZE  rcvd: 105

```

DuckDNS almost instantly propagates the changes but for other domain hosts, it could take a while. 

Once you can ensure that the TXT record changes has been successfully applied and is visible through the `dig` command, press enter on the Certbot prompt and your certificate should be generated.

## Renewing 

As we manually generated the certificate `certbot renew` will fail, to renew the certificate you need to simply re-generate the certificate using the above steps.

## Using the Certificate with Gunicorn

Example Gunicorn command for running a web-app:

```bash
gunicorn api:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:7589
```

To use the certificate with it, simply copy the `cert.pem` and `privkey.pem` to your working directory ( change the appropriate permissions ) and include them in the command

```bash
gunicorn api:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:7589 --certfile=cert.pem --keyfile=privkey.pem
```

Caveats with copying the certificate: If you renew the certificate you will have to re-copy the files
