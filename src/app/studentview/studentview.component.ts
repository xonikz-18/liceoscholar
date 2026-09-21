import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface Requirement {
  date:string;
  description:string;
  status:string;
  fileName:string;
  dataUrl:string;
  type:string;
}

interface PreviewFile {
  fileName:string;
  dataUrl:string;
  type:string;
  safeUrl:SafeResourceUrl;
  isDocument:boolean;
}

@Component({
  selector:'app-studentview',
  standalone:true,
  imports:[CommonModule],
  templateUrl:'./studentview.component.html',
  styleUrl:'./studentview.component.scss'
})
export class StudentviewComponent {
  requirements:Requirement[]=[
    {date:'08/06/2026',description:'2x2 Picture',status:'Pending',fileName:'',dataUrl:'',type:''},
    {date:'08/06/2026',description:'Report Card for Semester',status:'Approved',fileName:'',dataUrl:'',type:''},
    {date:'08/06/2026',description:'Form',status:'Disapproved',fileName:'',dataUrl:'',type:''}
  ];

  preview:PreviewFile|null=null;

  private allowedExtensions=['jpg','jpeg','png','pdf','doc','docx','xls','xlsx'];

  constructor(
    private router:Router,
    private sanitizer:DomSanitizer
  ){
    this.loadUploads();
  }

  logout():void{
    this.router.navigate(['/logout']);
  }

  onFileSelected(event:Event,index:number):void{
    const input=event.target as HTMLInputElement;
    const file=input.files?.[0];

    if(!file) return;

    const extension=file.name.split('.').pop()?.toLowerCase()||'';

    if(!this.allowedExtensions.includes(extension)){
      alert('Only JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, and XLSX files are allowed.');
      input.value='';
      return;
    }

    const reader=new FileReader();

    reader.onload=()=>{
      this.requirements[index].fileName=file.name;
      this.requirements[index].dataUrl=String(reader.result);
      this.requirements[index].type=file.type;
      this.saveUploads();
      input.value='';
    };

    reader.readAsDataURL(file);
  }

  truncateFileName(name:string):string{
    return name.length>18?`${name.slice(0,13)}....`:name;
  }

  previewFile(index:number):void{
    const file=this.requirements[index];

    if(!file.fileName) return;

    const extension=file.fileName.split('.').pop()?.toLowerCase()||'';
    const isDocument=['doc','docx','xls','xlsx'].includes(extension);

    this.preview={
      fileName:file.fileName,
      dataUrl:file.dataUrl,
      type:file.type,
      safeUrl:this.sanitizer.bypassSecurityTrustResourceUrl(file.dataUrl),
      isDocument
    };
  }

  closePreview():void{
    this.preview=null;
  }

  removeFile(index:number):void{
    this.requirements[index].fileName='';
    this.requirements[index].dataUrl='';
    this.requirements[index].type='';
    this.saveUploads();
  }

  private saveUploads():void{
    sessionStorage.setItem('studentUploads',JSON.stringify(this.requirements));
  }

  private loadUploads():void{
    const saved=sessionStorage.getItem('studentUploads');

    if(!saved) return;

    try{
      const uploads=JSON.parse(saved) as Requirement[];

      uploads.forEach((upload,index)=>{
        if(this.requirements[index]){
          this.requirements[index]=upload;
        }
      });
    }catch{
      sessionStorage.removeItem('studentUploads');
    }
  }
}