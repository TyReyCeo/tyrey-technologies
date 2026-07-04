# Use the OS certificate store for TLS (fixes CERTIFICATE_VERIFY_FAILED on
# Windows machines where antivirus/proxy software re-signs HTTPS traffic).
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:
    pass
