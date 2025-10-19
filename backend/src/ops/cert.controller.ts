import { Body, Controller, Post, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as multer from 'multer';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import * as forge from 'node-forge';

function getCertsDir(): string {
  const dir = process.env.CERTS_DIR || join(process.cwd(), 'certs')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

@Controller('admin/ops/cert')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CertController {
  @Post('pem')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'crt', maxCount: 1 },
    { name: 'key', maxCount: 1 },
    { name: 'chain', maxCount: 1 },
  ], {
    storage: multer.memoryStorage(),
    limits: { fileSize: 1_000_000 },
  }))
  async uploadPem(@UploadedFiles() files: { crt?: Express.Multer.File[]; key?: Express.Multer.File[]; chain?: Express.Multer.File[] }) {
    const crt = files.crt?.[0]
    const key = files.key?.[0]
    const chain = files.chain?.[0]
    if (!crt || !key) {
      throw new Error('crt ve key zorunludur')
    }
    const dir = getCertsDir()
    const crtContent = crt.buffer?.toString('utf8') || ''
    const chainContent = chain?.buffer?.toString('utf8') || ''
    const fullCrt = chainContent ? `${crtContent}\n${chainContent}` : crtContent
    writeFileSync(join(dir, 'server.crt'), fullCrt)
    chmodSync(join(dir, 'server.crt'), 0o644)

    const keyContent = key.buffer?.toString('utf8') || ''
    writeFileSync(join(dir, 'server.key'), keyContent)
    chmodSync(join(dir, 'server.key'), 0o600)
    return { ok: true }
  }

  @Post('pfx')
  @UseInterceptors(FileInterceptor('pfx', { storage: multer.memoryStorage(), limits: { fileSize: 2_000_000 } }))
  async uploadPfx(@UploadedFile() pfx: Express.Multer.File, @Body() body: { password: string }) {
    if (!pfx) throw new Error('pfx zorunludur')
    const password = body?.password || ''

    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfx.buffer))
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    let privateKeyPem = ''
    let certificatePem = ''
    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {
        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
          const key = safeBag.key
          privateKeyPem = forge.pki.privateKeyToPem(key as any)
        }
        if (safeBag.type === forge.pki.oids.certBag) {
          const cert = (safeBag.cert as any)
          certificatePem += forge.pki.certificateToPem(cert)
        }
      }
    }
    if (!privateKeyPem || !certificatePem) {
      throw new Error('PFX içeriği okunamadı (key/cert bulunamadı)')
    }
    const dir = getCertsDir()
    writeFileSync(join(dir, 'server.crt'), certificatePem)
    chmodSync(join(dir, 'server.crt'), 0o644)
    writeFileSync(join(dir, 'server.key'), privateKeyPem)
    chmodSync(join(dir, 'server.key'), 0o600)
    return { ok: true }
  }
}


